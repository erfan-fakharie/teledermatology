import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUpLeft, Plus, ShieldCheck } from "lucide-react";
import MskinLogo from "@/components/mskin-logo";
import ThemeToggle from "@/components/theme-toggle";
import { CaseViewer, Journey, LandingNav, LandingMotion, Services } from "./home-interactions";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "mskin | دکتر محمد صادقی",
  description: "مشاورهٔ آنلاین پوست، مو و تغذیه با دکتر محمد صادقی؛ از اولین دغدغه تا مشاوره و پیگیری در پروندهٔ شخصی شما.",
};

const questions = [
  ["برای شروع چه کاری انجام بدهم؟", "وارد حساب خود شوید، موضوع پوست، مو یا تغذیه را انتخاب کنید و شرح مشکل را بنویسید. در صورت تمایل، همان ابتدا عکس هم بفرستید. پزشک درخواست شما را بررسی می‌کند."],
  ["چه زمانی پرداخت می‌کنم و نوبتم چه موقع است؟", "پرداخت پس از پذیرش درخواست توسط پزشک انجام می‌شود. سپس وارد صف می‌شوید؛ نوبت ساعت و تاریخ قطعی ندارد. نزدیک نوبت، پزشک تکمیل پرونده را فعال می‌کند."],
  ["اگر هم برای پوست و هم برای مو مشاوره بخواهم؟", "می‌توانید هر دو موضوع را انتخاب کنید. برای هر موضوع، پرونده‌ای جدا دارید تا عکس‌ها، پیام‌ها و کارهای مورد نیاز مشخص و مرتب باشند."],
  ["بعد از مشاوره چطور پیگیری کنم؟", "پیگیری‌ها در پرونده و مطابق زمان‌بندی پکیج انجام می‌شوند. پزشک می‌تواند در دورهٔ پیگیری پیام بفرستد؛ برای موضوع ضروری، گزینهٔ «کار ضروری» در دسترس شماست."],
];

export default function Home() {
  return (
    <div id="top" className={styles.home}>
      <LandingMotion />
      <a className={styles.skipLink} href="#main">رفتن به محتوای صفحه</a>
      <header className={styles.siteHeader}>
        <div className={styles.header}>
          <a className={styles.brand} href="#top" aria-label="mskin، ابتدای صفحه"><MskinLogo height={32} /></a>
          <LandingNav showGallery />
          <div className={styles.headerActions}><ThemeToggle /><Link className={styles.headerLink} href="/login">ورود به مطب <ArrowUpLeft size={15} aria-hidden="true" /></Link></div>
        </div>
        <div className={styles.readingProgress} aria-hidden="true" />
      </header>

      <main id="main">
        <section className={styles.hero} aria-labelledby="intro">
          <div className={styles.heroHeading}>
            <div><span className={styles.eyebrow}>MSKIN / ONLINE CONSULTATION</span><h1 id="intro">مراقبت،<br /><span>به سبک شما.</span></h1></div>
            <div className={styles.heroAside}>
              <p>پوست، مو و تغذیه.<br />با دکتر محمد صادقی،<br />از هر کجا که هستید.</p>
              <Link className={styles.primary} href="/login" aria-describedby="request-expectations">ثبت درخواست مشاوره <ArrowLeft size={19} aria-hidden="true" /></Link>
              <p id="request-expectations" className={styles.requestExpectations}>مشاوره با متن و عکس؛ پرداخت پس از پذیرش پزشک.<br />پس از پرداخت وارد صف می‌شوید؛ نوبت تاریخ قطعی ندارد.</p>
            </div>
          </div>
          <div className={styles.heroTrack} data-hero-track>
            <div className={styles.heroSticky}>
              <figure className={styles.heroVisual}>
                <div className={styles.heroImage}><Image src="/doctor-portrait-enhanced.png" alt="دکتر محمد صادقی با دسته‌گل" fill sizes="100vw" quality={90} fetchPriority="high" /></div>
                <div className={styles.heroShade} />
                <span className={styles.heroWordmark} aria-hidden="true">mskin.</span>
                <figcaption className={styles.heroCaption}><span className={styles.photoEyebrow}>مراقبت با توجه به جزئیات</span><strong>دکتر محمد صادقی</strong><span>مشاورهٔ آنلاین · پروندهٔ شخصی · پیگیری</span></figcaption>
                <a className={styles.scrollCue} href="#approach"><ArrowDown size={20} aria-hidden="true" /><span>بیشتر آشنا شوید</span></a>
              </figure>
            </div>
          </div>
        </section>

        <section id="approach" className={styles.approach} aria-labelledby="approach-title">
          <div className={styles.approachIntro} data-reveal><span className={styles.kicker}>نگاه ما به مراقبت</span><h2 id="approach-title">پشت هر پرونده،<br /><span>یک آدم. یک داستان.</span></h2><p>شرح حال شما، عکس‌های شما و پرسش‌های شما.<br />نقطهٔ شروع مشاوره، شناخت دغدغهٔ شماست.</p></div>
          <div className={styles.editorial}>
            <figure className={styles.workPhoto} data-reveal><Image src="/doctor-at-work.jpg" alt="دکتر محمد صادقی هنگام کار در مطب" fill sizes="(max-width: 780px) 92vw, 50vw" /><figcaption>توجه، از نزدیک‌ترین جزئیات شروع می‌شود.</figcaption></figure>
            <div className={styles.editorialCopy} data-reveal><span className={styles.chapter}>01 / PERSONAL CARE</span><h3>فاصله کمتر.<br />گفت‌وگوی روشن‌تر.</h3><p>دغدغه‌تان را با متن و عکس توضیح دهید. پزشک پرونده را بررسی می‌کند و گفت‌وگو در همان‌جا ادامه پیدا می‌کند؛ با دسترسی به مسیر مشاوره و پیگیری‌های شما.</p><div className={styles.privacy}><ShieldCheck size={22} aria-hidden="true" /><span>عکس‌ها و گفت‌وگوهای شما،<br />در پروندهٔ خصوصی خودتان.</span></div></div>
          </div>
        </section>

        <section className={styles.servicesSection} aria-labelledby="services-title">
          <header className={styles.sectionHeading} data-reveal><div><span className={styles.kicker}>آشنایی با خدمات</span><h2 id="services-title">یک انتخاب.<br /><span>یک مسیر مخصوص شما.</span></h2></div><p>برای آشنایی، روی هر موضوع بزنید.<br />موضوع مشاوره را هنگام ثبت درخواست انتخاب می‌کنید.</p></header>
          <Services />
        </section>

        <section id="process" className={styles.processSection} aria-labelledby="process-title">
          <header className={styles.sectionHeading} data-reveal><div><span className={styles.kicker}>ساده، از اولین قدم</span><h2 id="process-title">از «یک سؤال دارم»<br /><span>تا «قدم بعدی چیست؟»</span></h2></div><p><span className={styles.desktopJourneyHint}>با اسکرول یا انتخاب هر مرحله، پیش‌نمایش آن را ببینید.</span><span className={styles.mobileJourneyHint}>روی هر مرحله بزنید تا توضیح و پیش‌نمایش آن تغییر کند.</span><br />چهار قدم، در یک پرونده.</p></header>
          <Journey />
        </section>

        <section id="cases" className={styles.gallerySection} aria-labelledby="cases-title">
          <header className={styles.sectionHeading} data-reveal><div><span className={styles.kicker}>گالری مطب</span><h2 id="cases-title">تغییر را<br /><span>از نزدیک ببینید.</span></h2></div><p>با انتخاب «قبل» و «بعد»،<br />هر تصویر را جداگانه ببینید.</p></header>
          <div className={styles.cases}>
            <CaseViewer number="۰۱" title="نمونهٔ اول" src="/skin-case-01.jpg" orientation="horizontal" />
            <CaseViewer number="۰۲" title="نمونهٔ دوم" src="/skin-case-02.jpg" orientation="vertical" />
          </div>
          <p className={styles.galleryNote}>تصاویر نمونه‌های ارائه‌شده از مطب هستند. نتیجهٔ درمان برای هر فرد متفاوت است.</p>
        </section>

        <section id="faq" className={styles.faqSection} aria-labelledby="faq-title"><div data-reveal><span className={styles.kicker}>پیش از شروع</span><h2 id="faq-title">شاید سؤال<br /><span>شما هم باشد.</span></h2></div><div className={styles.questions}>{questions.map(([title, text]) => <details key={title}><summary>{title}<Plus size={20} aria-hidden="true" /></summary><p>{text}</p></details>)}</div></section>

        <section id="start" className={styles.closing} aria-labelledby="closing-title">
          <div className={styles.closingCopy} data-reveal><MskinLogo height={43} tone="light" /><h2 id="closing-title">قدم اول،<br />از شما.</h2><p>دغدغه‌تان را با دکتر در میان بگذارید.</p><Link className={styles.primary} href="/login">ثبت درخواست مشاوره <ArrowLeft size={20} aria-hidden="true" /></Link><small>نسخهٔ نمایشی با حساب‌های نمونه</small></div>
          <div className={styles.closingPortrait}><Image src="/doctor-profile.jpg" alt="دکتر محمد صادقی در لباس کار" fill sizes="(max-width: 780px) 100vw, 55vw" /></div>
        </section>
      </main>
      <footer className={styles.footer}><div><MskinLogo height={28} /><span>مشاوره با دکتر محمد صادقی</span></div><a href="#top">بازگشت به بالا <ArrowUpLeft size={16} aria-hidden="true" /></a></footer>
    </div>
  );
}
