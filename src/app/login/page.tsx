import { demoAccounts } from "@/lib/catalog";
import { Login } from "@/components/client";
import MskinLogo from "@/components/mskin-logo";
import ThemeToggle from "@/components/theme-toggle";
export default function Page() {
  return <main className="landing"><div className="hero login"><div className="login-brand"><MskinLogo height={48}/><ThemeToggle/></div><span className="demo">نسخهٔ نمایشی</span><h1>ورود به سامانه</h1><p>برای بررسی مسیر پزشک یا بیمار، یک حساب ساختگی انتخاب کنید.</p><Login accounts={demoAccounts}/></div></main>;
}
