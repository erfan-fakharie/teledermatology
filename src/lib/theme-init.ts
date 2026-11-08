// Runs before the first paint. Storage can be unavailable in private browsers.
export const themeInit = `(()=>{
  const media=matchMedia('(prefers-color-scheme: dark)');
  let choice;
  try { choice=localStorage.getItem('mskin-theme'); } catch {}
  const apply=()=>{
    const theme=choice==='dark'||choice==='light'?choice:media.matches?'dark':'light';
    document.documentElement.dataset.theme=theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#151b19':'#163d30');
  };
  apply();
  media.addEventListener('change',apply);
  addEventListener('storage',e=>{if(e.key==='mskin-theme'||e.key===null){choice=e.newValue;apply();}});
  addEventListener('mskin-theme-change',()=>{choice=document.documentElement.dataset.theme;apply();});
  addEventListener('DOMContentLoaded',apply,{once:true});
})();`;
