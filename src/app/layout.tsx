import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "./style.css";
import { themeInit } from "@/lib/theme-init";
export const metadata: Metadata = {title:"mskin",description:"دموی مشاوره و پیگیری پوست، مو و تغذیه",manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"mskin"},icons:{icon:[{url:"/favicon.svg",type:"image/svg+xml"},{url:"/favicon-32.png",sizes:"32x32",type:"image/png"}],apple:"/apple-icon.png"}};
export const viewport: Viewport = {themeColor:"#163d30"};
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="fa" dir="rtl" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeInit}} /></head><body>{children}</body></html>;
}
