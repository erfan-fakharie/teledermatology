"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, Check, ClipboardList, Images, ListOrdered, MessagesSquare, Plus, ShieldCheck } from "lucide-react";
import styles from "./home.module.css";

// A single passive, frame-batched listener drives the cinematic opening.
// Content remains visible if JavaScript or motion is unavailable.
export function LandingMotion() {
  useEffect(() => {
    const root = document.getElementById("top");
    const track = root?.querySelector<HTMLElement>("[data-hero-track]");
    if (!root || !track) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.visible = "true";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    root.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
    function update() {
      frame = 0;
      if (!root || !track) return;
      const bounds = track.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight * .6 - bounds.top) / (innerHeight * .95)));
      root.style.setProperty("--hero-progress", preference.matches ? "0" : String(progress));
      const distance = document.documentElement.scrollHeight - innerHeight;
      root.style.setProperty("--reading-progress", String(distance > 0 ? scrollY / distance : 0));
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    function motionPreference() { root!.dataset.motion = preference.matches ? "off" : "on"; schedule(); }
    motionPreference();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    preference.addEventListener("change", motionPreference);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", motionPreference);
      delete root.dataset.motion;
    };
  }, []);
  return null;
}

const services = [
  { title: "پوست", en: "SKIN", detail: "از دغدغه‌های پوستتان بگویید.", text: "شرح مشکل و عکس‌های اولیه را ارسال کنید. سابقه و جزئیات مربوط به پوست در پروندهٔ مخصوص همین موضوع ثبت می‌شود.", tags: ["شرح مشکل", "تصاویر پوست", "پیگیری اختصاصی"] },
  { title: "مو", en: "HAIR", detail: "مسیر رسیدگی به مو، روشن‌تر.", text: "دغدغهٔ مو و پوست سرتان را توضیح دهید. عکس‌ها، سابقه و گفت‌وگوهای مربوط به مو در پرونده‌ای جدا دنبال می‌شوند.", tags: ["سابقهٔ مشکل", "تصاویر مو", "پروندهٔ مستقل"] },
  { title: "تغذیه", en: "NUTRITION", detail: "از عادت‌ها و هدف‌هایتان شروع کنید.", text: "درخواست مشاورهٔ تغذیه را با توضیح شرایط و هدفتان ثبت کنید. پس از پذیرش، اطلاعات مورد نیاز را با دعوت پزشک تکمیل خواهید کرد.", tags: ["شرح شرایط", "هدف شما", "پیگیری در پرونده"] },
];

export function Services() {
  const [selected, setSelected] = useState(0);
  return <div className={styles.services} data-reveal>
    <div className={styles.serviceTabs} role="tablist" aria-label="آشنایی با خدمات مشاوره">
      {services.map((service, index) => <button key={service.en} type="button" role="tab" id={`service-tab-${index}`} aria-controls={`service-panel-${index}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} data-kind={service.en} className={styles.serviceCard} onClick={() => setSelected(index)} onKeyDown={event => {
        const delta = event.key === "ArrowRight" ? -1 : event.key === "ArrowLeft" ? 1 : 0;
        if (!delta && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + delta + 3) % 3;
        setSelected(next);
        document.getElementById(`service-tab-${next}`)?.focus();
      }}>
        <span className={styles.serviceEnglish}>{service.en}</span><strong>{service.title}</strong>
        <span className={styles.serviceArt} aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <span className={styles.serviceMore}>جزئیات <ArrowDown size={16} aria-hidden="true" /></span>
      </button>)}
    </div>
    {services.map((service, index) => <div key={service.en} role="tabpanel" id={`service-panel-${index}`} aria-labelledby={`service-tab-${index}`} hidden={selected !== index} tabIndex={0} className={styles.serviceDetail}>
      <div><h3>{service.detail}</h3><p>{service.text}</p></div><div className={styles.serviceTags}>{service.tags.map(tag => <span key={tag}><Check size={14} aria-hidden="true" />{tag}</span>)}</div>
    </div>)}
  </div>;
}

const landingSections = [
  { id: "process", label: "مسیر مشاوره" },
  { id: "cases", label: "نمونه‌های قبل و بعد" },
  { id: "faq", label: "پرسش‌های متداول" },
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
  const root = useRef<HTMLDivElement>(null);
  const { icon: Icon, number, title } = steps[selected];

  useEffect(() => {
    const desktop = matchMedia("(min-width: 900px)");
    let frame = 0;
    function update() {
      frame = 0;
      if (!desktop.matches || !root.current) return;
      const elements = [...root.current.querySelectorAll<HTMLElement>("[data-step]")];
      const middle = innerHeight * .55;
      const closest = elements.reduce((best, element, index) => {
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - middle);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Infinity });
      setSelected(closest.index);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);

  function selectStep(index: number) {
    setSelected(index);
    if (matchMedia("(min-width: 900px)").matches) {
      root.current?.querySelectorAll<HTMLElement>("[data-step]")[index]?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }

  return (
    <div ref={root} className={styles.journey}>
      <div className={styles.journeySteps}>
        {steps.map((step, index) => <article key={step.number} data-step data-active={selected === index} className={styles.journeyStep}>
          <h3><button type="button" aria-pressed={selected === index} onClick={() => selectStep(index)}><span>{step.number}</span><strong>{step.title}</strong><ArrowLeft size={20} aria-hidden="true" /></button></h3><p>{step.text}</p>
        </article>)}
      </div>
      <div className={styles.mobileStepDescription}>
        <div aria-live="polite" aria-atomic="true"><strong>مرحلهٔ {number}: {title}</strong><p>{steps[selected].text}</p></div>
        <a href="#journey-preview">دیدن پیش‌نمایش این مرحله <ArrowDown size={16} aria-hidden="true" /></a>
      </div>
      <div id="journey-preview" className={styles.phoneStage}>
        <div className={styles.phoneHalo} aria-hidden="true" />
        <div className={styles.phone}>
          <div className={styles.phoneTop}><span dir="ltr">9:41</span><span className={styles.phoneIsland} /><ShieldCheck size={16} aria-hidden="true" /></div>
          <div className={styles.phoneBrand}>mskin<span>پروندهٔ من</span></div>
          <div className={styles.phoneScreen} key={number}>
            <span className={styles.phoneIcon}><Icon size={29} aria-hidden="true" /></span><span className={styles.phoneStep}>قدم {number} از ۰۴</span><h3>{title}</h3>
            {selected === 0 && <div className={styles.previewForm}><div className={styles.previewChips}><b>پوست</b><span>مو</span><span>تغذیه</span></div><div className={styles.previewField}>شرح دغدغهٔ من<span /><span /></div><div className={styles.previewUpload}><Plus size={17} /> افزودن عکس اولیه</div><div className={styles.previewButton}>ثبت درخواست <ArrowLeft size={16} /></div></div>}
            {selected === 1 && <div className={styles.previewQueue}><div className={styles.queueRing}><Check size={40} /></div><strong>درخواست پذیرفته شد</strong><p>پرداخت ← ورود به صف</p><span>جایگاه شما در همین پرونده نمایش داده می‌شود.</span></div>}
            {selected === 2 && <div className={styles.previewIntake}><div className={styles.intakeNotice}><Images size={18} /><span>دعوت به تکمیل پرونده</span></div>{["مشخصات و سوابق", "عکس‌های مورد نیاز", "توضیحات تکمیلی"].map(label => <div key={label}><span>{label}</span><span className={styles.intakeDot} /></div>)}<div className={styles.previewButton}>تکمیل اطلاعات <ArrowLeft size={16} /></div></div>}
            {selected === 3 && <div className={styles.previewChat}><span>نمونهٔ نمایشی گفت‌وگو</span><div><b>شما</b>عکس‌ها و توضیحات را فرستادم.</div><div><b>پزشک</b>ممنون. دربارهٔ زمان شروع مشکل هم توضیح دهید.</div><div className={styles.followup}><Check size={16} /> ادامهٔ مسیر در پیگیری‌ها</div></div>}
          </div>
          <div className={styles.phoneDots} aria-label="انتخاب مرحلهٔ نمایش">{steps.map((step, index) => <button key={step.number} type="button" onClick={() => selectStep(index)} aria-label={`نمایش مرحلهٔ ${step.title}`} aria-pressed={selected === index}><span /></button>)}</div>
          <span className={styles.phoneHome} aria-hidden="true" />
        </div>
        <span className={styles.previewLabel}>پیش‌نمایش مسیر مشاوره</span>
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
    <section className={styles.case} data-reveal aria-labelledby={titleId}>
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
