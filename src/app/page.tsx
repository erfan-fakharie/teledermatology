import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUpLeft, LockKeyhole } from "lucide-react";
import FaceMark from "@/components/face-mark";
import { CaseViewer, Journey, LandingNav } from "./home-interactions";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "محمد صادقی",
  description: "ثبت درخواست مشاورهٔ آنلاین پوست، مو و تغذیه و آشنایی با مراحل مشاوره و پیگیری.",
};

const gallery = [
  { number: "۰۱", title: "نمونهٔ اول", file: "skin-case-01.jpg", orientation: "horizontal" },
  { number: "۰۲", title: "نمونهٔ دوم", file: "skin-case-02.jpg", orientation: "vertical" },
] as const;

export default function Home() {
  const galleryItems = gallery.filter(({ file }) => existsSync(join(process.cwd(), "public", file)));
  return (
    <div id="top" className={styles.home}>
      <header className={styles.siteHeader}>
        <div className={styles.header}>
          <a className={styles.brand} href="#top">
            <span className={styles.mark}><FaceMark size={28} /></span>
            <span>محمد صادقی<small>مشاورهٔ آنلاین</small></span>
          </a>
          <LandingNav showGallery={galleryItems.length > 0} />
          <Link className={styles.headerLink} href="/login">ورود به مطب <ArrowUpLeft size={16} aria-hidden="true" /></Link>
        </div>
        <div className={styles.readingProgress} aria-hidden="true" />
      </header>

      <main className={styles.content}>
        <section className={styles.hero} aria-labelledby="intro">
          <div className={styles.intro}>
            <span className={styles.kicker}>مشاورهٔ آنلاین پوست، مو و تغذیه</span>
            <h1 id="intro">محمد صادقی</h1>
            <p>دغدغه‌تان را با پزشک در میان بگذارید و از ثبت درخواست تا مشاوره و پیگیری، همه‌چیز را در پروندهٔ خودتان دنبال کنید.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/login">ورود و ثبت درخواست <ArrowLeft size={19} aria-hidden="true" /></Link>
              <a className={styles.textLink} href="#process">مراحل مشاوره <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <small className={styles.demo}><LockKeyhole size={14} aria-hidden="true" /> نسخهٔ نمایشی با حساب‌های نمونه</small>
          </div>
          <figure className={styles.portrait}>
            <Image src="/doctor-portrait.jpg" alt="دکتر محمد صادقی با دسته‌گل" fill sizes="(max-width: 780px) 92vw, 46vw" fetchPriority="high" />
            <figcaption>
              <span className={styles.mark}><FaceMark size={22} /></span>
              <span>دکتر محمد صادقی<small>مشاوره و پیگیری آنلاین</small></span>
            </figcaption>
          </figure>
        </section>

        <section className={styles.section} id="process" aria-labelledby="process-title">
          <span className={styles.kicker}>از درخواست تا پیگیری</span>
          <h2 id="process-title" className={styles.reveal}>مسیر مشاوره چطور پیش می‌رود؟</h2>
          <Journey />
        </section>

        {galleryItems.length > 0 && <section className={styles.section} id="cases" aria-labelledby="cases-title">
          <span className={styles.kicker}>گالری مطب</span>
          <h2 id="cases-title" className={styles.reveal}>نمونه‌های قبل و بعد</h2>
          <div className={styles.cases}>
            {galleryItems.map(({ number, title, file, orientation }) => (
              <CaseViewer key={number} number={number} title={title} src={`/${file}`} orientation={orientation} />
            ))}
          </div>
        </section>}

        <section id="start" className={`${styles.closing} ${styles.reveal}`} aria-labelledby="closing-title">
          <div className={styles.closingCopy}>
            <span className={styles.kicker}>شروع مشاوره</span>
            <h2 id="closing-title">دغدغه‌تان را با دکتر در میان بگذارید</h2>
            <Link className={styles.primary} href="/login">ورود به مطب <ArrowLeft size={19} aria-hidden="true" /></Link>
          </div>
          <div className={styles.profile}>
            <Image src="/doctor-profile.jpg" alt="دکتر محمد صادقی در لباس کار" fill sizes="(max-width: 780px) 92vw, 40vw" />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>محمد صادقی</span>
        <a href="#top">بازگشت به بالا <ArrowUpLeft size={16} aria-hidden="true" /></a>
      </footer>
    </div>
  );
}
