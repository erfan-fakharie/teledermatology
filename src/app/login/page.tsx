import { demoAccounts } from "@/lib/catalog";
import { Login } from "@/components/client";
import FaceMark from "@/components/face-mark";
export default function Page() {
  return <main className="landing"><div className="hero login"><span className="mark"><FaceMark size={28}/></span><span className="demo">نسخهٔ نمایشی</span><h1>ورود به سامانهٔ محمد صادقی</h1><p>برای بررسی مسیر پزشک یا بیمار، یک حساب ساختگی انتخاب کنید.</p><Login accounts={demoAccounts}/></div></main>;
}
