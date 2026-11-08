import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardList, LayoutDashboard, History, ListOrdered, LockKeyhole, Plus, UserRound, FileText, Image as ImageIcon, MessagesSquare, Clock3, Paperclip } from "lucide-react";
import FaceMark from "@/components/face-mark";
import { session } from "@/lib/auth";
import { db } from "@/lib/db";
import { canSendUrgent, canWrite } from "@/lib/workflow";
import { fa, labels, title } from "@/lib/catalog";
import { Action, Composer, Intake, MessageControls, Note, Photos, ReadyMark, Refresh, RegisterWorker, RequestForm } from "@/components/client";
import DoctorWorkbench from "./doctor-workbench";

export const dynamic="force-dynamic";
type IntakeValues = import("@/components/client").IntakeValues;
const date=(value:Date)=>new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Tehran"}).format(value);
const rankStates=["WAITING","PREPARING","READY","IN_PROGRESS"];
function status(value:string) { return <span className={"badge "+(["READY","OPEN"].includes(value)?"green":value==="IN_PROGRESS"?"amber":"")}>{labels[value]??value}</span>; }

export default async function Dashboard({searchParams}:{searchParams:Promise<{view?:string;case?:string;tab?:string;q?:string;filter?:string}>}) {
  const user=await session();
  if(!user) redirect("/login");
  const params=await searchParams;
  const doctor=user.role==="DOCTOR";
  const view=params.view??(doctor?(params.case||params.tab?"queue":"workbench"):"cases");
  const workbench=doctor&&view==="workbench";
  const [cases,allQueue]=workbench?[[],[]]:await Promise.all([
    db.case.findMany({where:doctor?{}:{patientId:user.id},orderBy:{createdAt:"desc"},include:{patient:{select:{name:true}},queue:true,payments:{orderBy:{createdAt:"desc"},take:1,select:{result:true}},episodes:{orderBy:{number:"asc"}},notices:{orderBy:{createdAt:"desc"},take:3}}}),
    db.queueEntry.findMany({where:{state:{in:rankStates}},select:{caseId:true,state:true,ordinal:true},orderBy:{ordinal:"asc"}}),
  ]);
  allQueue.sort((a,b)=>Number(b.state==="IN_PROGRESS")-Number(a.state==="IN_PROGRESS")||a.ordinal-b.ordinal);
  const positions=new Map(allQueue.map((item,i)=>[item.caseId,i+1]));
  const filters=cases.filter(c=>{
    if(doctor&&view==="requests")return ["PENDING_REVIEW","AWAITING_PAYMENT","REJECTED"].includes(c.status);
    if(doctor&&view==="followups")return c.status==="FOLLOWUP_PERIOD"||c.status==="CLOSED";
    if(doctor&&view==="queue")return c.queue&&c.queue.state!=="DONE"&&(!params.q||c.patient.name.includes(params.q))&&(!params.filter||params.filter==="all"||(params.filter==="ready"?c.queue.state==="READY":["WAITING","PREPARING"].includes(c.queue.state)));
    return true;
  });
  if(doctor&&view==="queue")filters.sort((a,b)=>(positions.get(a.id)??Infinity)-(positions.get(b.id)??Infinity));
  const selectedCase=cases.find(c=>c.id===params.case);
  const current=selectedCase??filters[0];
  const section=doctor?(view==="requests"?"درخواست‌ها":view==="followups"?"پیگیری‌ها":view==="queue"?"صف مشاوره":"میز کار پزشک"):"پرونده‌های من";
  const nav=doctor?[
    {view:"workbench",label:"میز کار",icon:LayoutDashboard},
    {view:"requests",label:"درخواست‌ها",icon:ClipboardList},{view:"queue",label:"صف",icon:ListOrdered},{view:"followups",label:"پیگیری‌ها",icon:History},
  ]:[{view:"cases",label:"پرونده‌ها",icon:ClipboardList},{view:"new",label:"درخواست جدید",icon:Plus}];
  const listParams=new URLSearchParams({view});
  if (params.q) listParams.set("q",params.q);
  if (params.filter) listParams.set("filter",params.filter);
  const listUrl=`/app?${listParams}`;
  const url=(tab:string)=>`${listUrl}&case=${current?.id}&tab=${tab}`;
  const tab=params.tab??"summary";
  const detail=current&&view!=="new"&&view!=="account"?await db.case.findUnique({
    where:{id:current.id},
    select:{id:true,note:doctor,files:{where:{episodeId:null},select:{id:true,filename:true,bytes:true}},episodes:{orderBy:{number:"asc"},include:{messages:{orderBy:{createdAt:"asc"},include:{files:{select:{id:true,filename:true}}}},files:{where:{ownerId:user.id,messageId:null},select:{id:true,filename:true}}}}},
  }):null;
  return <div className="shell">
    <RegisterWorker/>
    <nav className="nav" aria-label="ناوبری سامانه"><Link href="/app" className="brand"><FaceMark size={30}/><span>محمد صادقی</span></Link>
      {nav.map(({view:key,label,icon:Icon})=><Link prefetch={false} key={key} aria-current={view===key?"page":undefined} className={view===key?"active":""} href={"/app?view="+key}><Icon size={22} aria-hidden="true"/><span>{label}</span></Link>)}
      <Link prefetch={false} aria-current={view==="account"?"page":undefined} className={view==="account"?"active":""} href="/app?view=account"><UserRound size={22} aria-hidden="true"/><span>حساب</span></Link>
    </nav>
    <main className="main">
      <header className="top"><div><small>محمد صادقی / {doctor?"پزشک":"بیمار"}</small><h1>{view==="new"?"درخواست مشاوره":view==="account"?"حساب کاربری":section}</h1></div><div className="actions"><span className="demo">نسخهٔ نمایشی</span><Refresh/></div></header>
      {workbench?<DoctorWorkbench doctorId={user.id}/>
      :view==="account"?<section className="panel flow"><h2>{user.name}</h2><p>حساب نمایشی {doctor?"پزشک":"بیمار"}</p><Action text="خروج از حساب" data={{type:"logout"}}/></section>
      :view==="new"&&!doctor?<section className="panel"><RequestForm/></section>
      :<div className={`workspace ${selectedCase||(params.tab&&current)?"case-open":""}`}>
        <section className="panel queue"><header className="section-head"><h2>{view==="requests"?"فهرست درخواست‌ها":"فهرست پرونده‌ها"}</h2><span className="count">{fa(filters.length)}</span></header>
          {doctor&&view==="queue"&&<form className="flow search"><input type="hidden" name="view" value="queue"/><label>جست‌وجوی بیمار<input name="q" defaultValue={params.q} placeholder="نام بیمار"/></label><div className="actions">{[["all","همه"],["ready","آماده"],["incomplete","ناقص"]].map(([value,label])=><button key={value} name="filter" value={value} className={"btn small "+((params.filter??"all")===value?"primary":"")}>{label}</button>)}</div></form>}
          {!doctor&&<Link href="/app?view=new" className="btn primary new"><Plus size={16}/> درخواست جدید</Link>}
          {!filters.length&&<p className="muted">در این بخش پرونده‌ای وجود ندارد.</p>}
          <div className="queue-items">{filters.map(c=><Link prefetch={false} aria-current={c.id===selectedCase?.id?"page":undefined} className={"queue-item "+(c.id===current?.id?"selected":"")} key={c.id} href={`${listUrl}&case=${c.id}`}>
            <span className="avatar">{positions.has(c.id)?fa(positions.get(c.id)!):<UserRound size={19}/>}</span><div><strong>{doctor?c.patient.name:title(c.areas)}</strong><small>{doctor?title(c.areas):"مشاورهٔ آنلاین"}</small></div>{status(c.status==="QUEUED"?c.queue?.state??c.status:c.status)}
          </Link>)}</div>
        </section>
        {current&&detail?<section className="panel workbench">
          <Link className="case-back" prefetch={false} href={listUrl}><ArrowRight size={17} aria-hidden="true"/> بازگشت به فهرست</Link>
          <header className="case-header"><div className="identity"><span className="avatar"><UserRound size={23}/></span><div><h2>{doctor?current.patient.name:title(current.areas)}</h2><div className="actions"><span className="soft">{title(current.areas)}</span>{status(current.status==="QUEUED"?current.queue?.state??current.status:current.status)}</div></div></div>
            {doctor&&current.queue?.state==="READY"&&<Action text="شروع مشاوره" data={{type:"start",id:current.id}}/>}
          </header>
          <nav className="tabs" aria-label="بخش‌های پرونده">
            {[["summary","پرونده",FileText],["photos","تصاویر",ImageIcon],["chat","گفت‌وگو",MessagesSquare],...(doctor?[["note","یادداشت",ClipboardList]]:[])].map(([key,label,Icon])=>{
              const Glyph=Icon as typeof FileText;return <Link key={String(key)} aria-current={tab===key?"page":undefined} className={tab===key?"active":""} href={url(String(key))}><Glyph size={17} aria-hidden="true"/>{String(label)}</Link>;
            })}
          </nav>
          {tab==="note"&&doctor?<Note key={current.id} id={current.id} value={detail.note??""}/>
          :tab==="photos"?<Photos key={current.id} files={detail.files} allowRemove={!doctor&&current.queue?.state==="PREPARING"}/>
          :tab==="chat"?<div className="flow">
            {!detail.episodes.length&&<div className="soft">گفت‌وگو پس از شروع مشاوره در دسترس است.</div>}
            {detail.episodes.map(ep=>{
              const writable=canWrite(ep,user.role,current.demoNow??new Date());
              const urgentAllowed=canSendUrgent(ep,user.role);
              const heading=ep.number?`پیگیری ${fa(ep.number)}`:"مشاورهٔ اولیه";
              const messages=ep.messages.length?<ol className="chat-log" aria-label={`پیام‌های ${heading}`}>{ep.messages.map(msg=><li key={msg.id} className={"message "+(msg.author===user.id?"own":"")}>
                  <div className="message-meta"><strong>{msg.author===user.id?"شما":doctor?"بیمار":"پزشک"}</strong><time dateTime={msg.createdAt.toISOString()}>{date(msg.createdAt)}</time></div>
                  {msg.urgent&&<span className="badge amber">مورد ضروری</span>}
                  {msg.body&&<p dir="auto">{msg.body}</p>}
                  {msg.files.map(f=><a key={f.id} href={`/api/files/${f.id}?variant=original`} target="_blank" rel="noreferrer"><Paperclip size={14} aria-hidden="true"/><bdi>{f.filename}</bdi></a>)}
                  {msg.author===user.id&&ep.state!=="CLOSED"&&<MessageControls id={current.id} messageId={msg.id} body={msg.body}/>}
                </li>)}</ol>:<p className="chat-empty">هنوز پیامی در این گفت‌وگو نیست.</p>;
              if (ep.state==="CLOSED") return <details className="chat-archive" id={`episode-${ep.id}`} key={ep.id}>
                <summary><span>{heading}</span>{status(ep.state)}</summary>{messages}
              </details>;
              return <article className="inner flow chat-thread" id={`episode-${ep.id}`} key={ep.id}>
                <header className="chat-header"><div className="section-head"><h3>{heading}</h3>{status(ep.state)}</div>
                  {ep.eligibleAt&&<small>موعد پیگیری · {date(ep.eligibleAt)}</small>}
                </header>
                {messages}
                {writable?<Composer id={current.id} episodeId={ep.id} initialFiles={ep.files} allowUrgent={urgentAllowed}/>:<div className="soft"><LockKeyhole size={16}/>{ep.state==="CLOSED"?"این مرحله بسته شده است.":"ارسال پیام عادی از موعد پیگیری فعال می‌شود."}</div>}
                {!writable&&urgentAllowed&&<details><summary>مورد ضروری</summary><Composer id={current.id} episodeId={ep.id} initialFiles={[]} urgentOnly/></details>}
                {doctor&&ep.state==="OPEN"&&<Action text={ep.number?"پایان پیگیری":"پایان مشاوره"} confirmText="با پایان این مرحله، ارسال پیام در این گفت‌وگو بسته می‌شود. ادامه می‌دهید؟" secondary data={{type:"close",id:current.id,episodeId:ep.id}}/>}
                {doctor&&ep.state==="SCHEDULED"&&<details><summary>ابزار دمو</summary><Action text="جلو بردن زمان دمو" secondary data={{type:"advance",id:current.id}}/></details>}
              </article>;
            })}
            {current.status==="CLOSED"&&<div className="soft">چرخهٔ نمونهٔ دو پیگیری تکمیل شده است.</div>}
          </div>:<div className="flow">
            <div className="overview"><section className="inner flow"><h3>شرح اولیه</h3><p>{current.concern}</p>{current.reason&&<p className="soft">{current.reason}</p>}
              {current.intake&&<><h3>شرح حال تکمیلی</h3><p>{(current.intake as {history?:string}).history}</p><small>{(current.intake as {duration?:string}).duration}</small></>}
              {current.queue&&<ReadyMark ready={["READY","IN_PROGRESS","DONE"].includes(current.queue.state)}/>}
            </section><Photos key={current.id} files={detail.files} allowRemove={!doctor&&current.queue?.state==="PREPARING"}/></div>
            {!doctor&&positions.has(current.id)&&<div className="soft"><Clock3 size={17}/> جایگاه {fa(positions.get(current.id)!)} · {fa(positions.get(current.id)!-1)} پرونده جلوتر</div>}
            {current.queue?.holdReason&&<p className="soft">دلیل تعویق · {current.queue.holdReason}</p>}
            {doctor&&current.status==="PENDING_REVIEW"&&<div className="inner flow"><Action text="پذیرش درخواست" data={{type:"approve",id:current.id}}/><Action text="رد درخواست" secondary reason data={{type:"reject",id:current.id}}/></div>}
            {!doctor&&current.status==="AWAITING_PAYMENT"&&<div className="inner flow"><h3>پرداخت نمایشی</h3><p>{fa(current.amount)} تومان</p>{current.payments[0]?.result==="FAILED"&&<p className="error">پرداخت آزمایشی ناموفق بود. دوباره تلاش کنید.</p>}{current.payments[0]?.result==="CANCELLED"&&<p className="soft">پرداخت آزمایشی لغو شد.</p>}<div className="actions">{[["VERIFIED","پرداخت موفق"],["FAILED","پرداخت ناموفق"],["CANCELLED","انصراف"]].map(([result,text])=><Action key={result} text={text} secondary={result!=="VERIFIED"} data={{type:"pay",id:current.id,result}}/>)}</div></div>}
            {doctor&&current.queue?.state==="WAITING"&&<Action text="درخواست تکمیل پرونده" data={{type:"prepare",id:current.id}}/>}
            {doctor&&current.queue?.state==="READY"&&<Action text="درخواست اصلاح اطلاعات" secondary reason data={{type:"correct",id:current.id}}/>}
            {doctor&&current.queue&&["WAITING","PREPARING","READY"].includes(current.queue.state)&&<details><summary>موکول کردن پرونده</summary><Action text="موکول کردن" secondary reason data={{type:"hold",id:current.id}}/></details>}
            {doctor&&current.queue?.state==="ON_HOLD"&&<Action text="بازگرداندن به صف" data={{type:"resume",id:current.id}}/>}
            {!doctor&&current.queue?.state==="PREPARING"&&<section className="inner flow"><h3>تکمیل پرونده</h3><Intake key={current.id} id={current.id} initial={(current.intake??{}) as IntakeValues} areas={current.areas}/></section>}
            {detail.episodes.length>0&&<Link className="btn primary" href={url("chat")}>مشاهدهٔ گفت‌وگو</Link>}
            {current.notices.length>0&&<section className="inner flow"><h3>اطلاع‌رسانی</h3>{current.notices.map(n=><div className="notice" key={n.key}><span className="demo">شبیه‌سازی شده</span><span>{n.text}</span><small>{date(n.createdAt)}</small></div>)}</section>}
          </div>}
        </section>:<section className="panel empty"><ClipboardList size={38}/><h2>پرونده‌ای انتخاب نشده</h2><p>{doctor?"پرونده‌ها در فهرست همین بخش نمایش داده می‌شوند.":"برای شروع، یک درخواست مشاوره ثبت کنید."}</p>{!doctor&&<Link className="btn primary" href="/app?view=new">درخواست مشاوره</Link>}</section>}
      </div>}
    </main>
  </div>;
}
