"use client";
export default function ErrorView({reset}:{reset:()=>void}) {
  return <main className="landing"><section className="hero"><h1>بارگذاری پرونده انجام نشد</h1><p>اتصال را بررسی کنید و دوباره تلاش کنید.</p><button className="btn primary" onClick={reset}>تلاش دوباره</button></section></main>;
}
