import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "./style.css";
export const metadata: Metadata = {title:"محمد صادقی",description:"دموی مشاوره و پیگیری پوست، مو و تغذیه",manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"محمد صادقی"},icons:{icon:"/icon-192.png",apple:"/apple-icon.png"}};
export const viewport: Viewport = {themeColor:"#142f36"};
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
