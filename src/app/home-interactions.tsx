"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ClipboardList, Images, ListOrdered, MessagesSquare } from "lucide-react";
import styles from "./home.module.css";

const landingSections = [
  { id: "process", label: "مسیر مشاوره" },
  { id: "cases", label: "نمونه‌های قبل و بعد" },
  { id: "start", label: "شروع مشاوره" },
] as const;

export function LandingNav({ showGallery }: { showGallery: boolean }) {
  const nav = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string>();

  useEffect(() => {
    const header = nav.current?.closest("header");
    const sections = landingSections.map(({ id }) => document.getElementById(id)).reverse();
    let frame: number | undefined;

    function update() {
      frame = undefined;
      const edge = (header?.getBoundingClientRect().bottom ?? 0) + 24;
      const atBottom = window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const current = atBottom ? sections[0] : sections.find(section => section && section.getBoundingClientRect().top <= edge);
      setActive(current?.id);
    }

    function schedule() {
      frame ??= requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav ref={nav} className={styles.nav} data-gallery={showGallery} aria-label="بخش‌های صفحه">
      {landingSections.filter(({ id }) => id !== "cases" || showGallery).map(({ id, label }) => (
        <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>{label}</a>
      ))}
    </nav>
  );
}

const steps = [
  { icon: ClipboardList, number: "۰۱", title: "ثبت درخواست", text: "موضوع مشاوره‌تان را از میان پوست، مو و تغذیه انتخاب کنید. در این مرحله کافی است شرح کوتاهی از دغدغه‌تان بنویسید." },
  { icon: ListOrdered, number: "۰۲", title: "ورود به صف", text: "پزشک درخواست را بررسی می‌کند. اگر پذیرفته شد، بعد از پرداخت می‌توانید جایگاهتان را در صف مطب ببینید." },
  { icon: Images, number: "۰۳", title: "تکمیل پرونده", text: "با دعوت پزشک، مشخصات و عکس‌های مورد نیاز را از طریق پروندهٔ خصوصی خودتان ارسال کنید." },
  { icon: MessagesSquare, number: "۰۴", title: "مشاوره و پیگیری", text: "در پرونده با پزشک پیام ردوبدل کنید. وقتی موعد پیگیری بعدی برسد، می‌توانید گفت‌وگو را از همان‌جا ادامه دهید." },
];

export function Journey() {
  const [selected, setSelected] = useState(0);
  const { icon: Icon, number, title, text } = steps[selected];

  return (
    <div className={`${styles.journey} ${styles.reveal}`}>
      <ol className={styles.stepList} aria-label="انتخاب مرحلهٔ مشاوره">
        {steps.map((step, index) => (
          <li key={step.number}>
            <button type="button" aria-pressed={index === selected} onClick={() => setSelected(index)}>
              <span>{step.number}</span>{step.title}<ArrowLeft size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      <div className={styles.stepDetail} aria-live="polite">
        <div key={number} className={styles.stepBody}>
          <span className={styles.stepIcon}><Icon size={28} aria-hidden="true" /></span>
          <span className={styles.stepNumber} aria-hidden="true">{number}</span>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      </div>
    </div>
  );
}

const views = [
  { value: "both", label: "هر دو عکس" },
  { value: "before", label: "قبل" },
  { value: "after", label: "بعد" },
] as const;
type View = (typeof views)[number]["value"];

type CaseProps = {
  number: string;
  title: string;
  src: string;
  orientation: "horizontal" | "vertical";
};

export function CaseViewer({ number, title, src, orientation }: CaseProps) {
  const [view, setView] = useState<View>("both");
  const titleId = `case-${number}`;
  const description = view === "both" ? "تصاویر قبل و بعد" : view === "before" ? "تصویر قبل" : "تصویر بعد";

  return (
    <section className={`${styles.case} ${styles.reveal}`} aria-labelledby={titleId}>
      <div className={styles.caseHeader}>
        <div className={styles.caseTitle}>
          <span aria-hidden="true">{number}</span>
          <h3 id={titleId}>{title}</h3>
        </div>
        <div className={styles.segments} role="group" aria-label={`نمایش عکس‌های ${title}`}>
          {views.map(({ value, label }) => (
            <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>
          ))}
        </div>
      </div>
      <figure className={styles.casePhoto} data-orientation={orientation} data-view={view}>
        <Image src={src} alt={`${description}، ${title}`} fill sizes="(max-width: 780px) 88vw, 38vw" />
        <figcaption className={styles.photoLabels} aria-hidden="true">
          {view !== "after" && <span className={styles.before}>قبل</span>}
          {view !== "before" && <span className={styles.after}>بعد</span>}
        </figcaption>
      </figure>
    </section>
  );
}
