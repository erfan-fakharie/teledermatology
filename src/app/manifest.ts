import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {id:"/",name:"mskin",short_name:"mskin",lang:"fa",dir:"rtl",start_url:"/",scope:"/",display:"standalone",background_color:"#f6faf7",theme_color:"#163d30",icons:[
    {src:"/icon-192.png",sizes:"192x192",type:"image/png"},
    {src:"/icon-512.png",sizes:"512x512",type:"image/png"},
    {src:"/maskable.png",sizes:"512x512",type:"image/png",purpose:"maskable"},
  ]};
}
