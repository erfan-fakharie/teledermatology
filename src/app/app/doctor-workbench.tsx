import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { fa, title } from "@/lib/catalog";
import { db } from "@/lib/db";
import PatientAvatar from "@/components/patient-avatar";

type Task = { id: string; patientId: string; name: string; area: string; action: string; href: string; urgent?: boolean };

export default async function DoctorWorkbench({ doctorId }: { doctorId: string }) {
  const cases = await db.case.findMany({
    where: {
      OR: [
        { status: "PENDING_REVIEW" },
        { queue: { state: "READY" } },
        { episodes: { some: { state: "OPEN", messages: { some: {} } } } },
        { episodes: { some: { state: "SCHEDULED", messages: { some: { urgent: true } } } } },
      ],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      status: true,
      areas: true,
      patient: { select: { id: true, name: true } },
      queue: { select: { state: true, ordinal: true } },
      episodes: {
        where: { state: { in: ["OPEN", "SCHEDULED"] } },
        orderBy: { number: "desc" },
        select: {
          id: true,
          number: true,
          messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { author: true } },
        },
      },
    },
  });

  const episodeIds = cases.flatMap(item => item.episodes
    .filter(episode => episode.messages[0]?.author === item.patient.id)
    .map(episode => episode.id));
  const priorityMessages = episodeIds.length ? await db.message.findMany({
    where: { episodeId: { in: episodeIds }, OR: [{ urgent: true }, { author: doctorId }] },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    distinct: ["episodeId"],
    select: { episodeId: true, urgent: true },
  }) : [];
  const urgentEpisodes = new Set(priorityMessages.filter(message => message.urgent).map(message => message.episodeId));

  const urgentReplies: Task[] = [];
  const replies: Task[] = [];
  const reviews = [];
  const requests = [];
  for (const item of cases) {
    const reply = item.episodes.find(episode => urgentEpisodes.has(episode.id))
      ?? item.episodes.find(episode => episode.messages[0]?.author === item.patient.id);
    const row = { id: item.id, patientId: item.patient.id, name: item.patient.name, area: title(item.areas) };
    if (reply) {
      const view = reply.number ? "followups" : "queue";
      const urgent = urgentEpisodes.has(reply.id);
      (urgent ? urgentReplies : replies).push({
        ...row,
        urgent,
        action: urgent ? "پاسخ به مورد ضروری" : reply.number ? "پاسخ به پیگیری" : "پاسخ به پیام",
        href: `/app?view=${view}&case=${item.id}&tab=chat#episode-${reply.id}`,
      });
    } else if (item.queue?.state === "READY") {
      reviews.push({ ...row, ordinal: item.queue.ordinal, action: "بررسی پرونده", href: `/app?view=queue&case=${item.id}` });
    } else if (item.status === "PENDING_REVIEW") {
      requests.push({ ...row, action: "بررسی درخواست", href: `/app?view=requests&case=${item.id}` });
    }
  }
  const tasks: Task[] = [...urgentReplies, ...replies, ...reviews.sort((a, b) => a.ordinal - b.ordinal), ...requests];

  return (
    <section className="panel doctor-workbench" aria-labelledby="doctor-actions">
      <header className="section-head">
        <h2 id="doctor-actions">نیاز به اقدام شما</h2>
        {tasks.length > 0 && <span className="count">{fa(tasks.length)} پرونده</span>}
      </header>
      {tasks.length ? (
        <ul className="doctor-tasks">
          {tasks.map(task => (
            <li key={task.id}>
              <Link prefetch={false} className={task.urgent ? "urgent-task" : undefined} href={task.href}>
                <span className="doctor-task-patient"><PatientAvatar userId={task.patientId} size={44}/><span><strong>{task.name}</strong><small>{task.area}</small></span></span>
                <span className={task.urgent ? "doctor-task-action badge amber" : "doctor-task-action"}>{task.action}<ArrowLeft size={17} aria-hidden="true" /></span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="doctor-tasks-empty"><CheckCircle2 size={19} aria-hidden="true" /> فعلاً کاری برای انجام ندارید.</p>
      )}
    </section>
  );
}
