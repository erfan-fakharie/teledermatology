/* Private images bypass the shared image optimizer. Full reloads isolate authenticated role changes. */
/* eslint-disable @next/next/no-img-element, @next/next/no-location-assign-relative-destination */
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, ArrowLeft, Check, Ellipsis, Expand, ImagePlus, Paperclip, ScanFace, Send, Upload, Waves } from "lucide-react";
import { areaLabels, areas, demoPrice, fa, maxImageBytes, maxInitialPhotos, title } from "@/lib/catalog";
import PatientAvatar from "@/components/patient-avatar";

type Asset = { id:string; filename:string; bytes?:number };
type Values = Record<string,unknown>;
const packageIcons = { SKIN: ScanFace, HAIR: Waves, DIET: Apple };

async function submit(input: Values | FormData, endpoint?: string) {
  const upload = input instanceof FormData;
  const response = await fetch(endpoint??(upload?"/api/files":"/api/action"),{
    method:"POST",headers:upload?undefined:{"Content-Type":"application/json"},body:upload?input:JSON.stringify(input),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "درخواست انجام نشد.");
  return json.data as {id?:string; filename?:string};
}

function useSubmit() {
  const router = useRouter();
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const pending = useRef(false);
  async function run(input: Values | FormData, done?: (data:{id?:string;filename?:string})=>void, endpoint?: string) {
    if (pending.current) return;
    pending.current=true;
    setBusy(true);
    setError("");
    try { const data=await submit(input,endpoint); done?.(data); router.refresh(); }
    catch (error) { setError(error instanceof Error && error.message !== "Failed to fetch" ? error.message : "ارتباط برقرار نشد. دوباره تلاش کنید."); }
    finally { pending.current=false;setBusy(false); }
  }
  return {error,busy,run};
}
function ErrorText({text}:{text:string}) { return text ? <p className="error" role="alert">{text}</p>:null; }
export function Action({text,data,secondary=false,reason=false,confirmText}:{text:string;data:Values;secondary?:boolean;reason?:boolean;confirmText?:string}) {
  const {error,busy,run}=useSubmit();
  return <form className={reason?"flow":"inline"} onSubmit={e=>{
    e.preventDefault();
    if(confirmText&&!window.confirm(confirmText)) return;
    const fields=new FormData(e.currentTarget);
    void run({...data,...(reason?{reason:fields.get("reason")}:{})},()=>{if(data.type==="logout") location.assign("/login");});
  }}>
    {reason&&<label>دلیل<textarea name="reason" rows={2} required maxLength={5000}/></label>}
    <button className={secondary?"btn":"btn primary"} disabled={busy}>{busy?"در حال ثبت…":text}</button><ErrorText text={error}/>
  </form>;
}

export function Login({accounts}:{accounts:readonly {id:string;name:string;role:string}[]}) {
  const {error,busy,run}=useSubmit();
  return <div className="flow">{accounts.map(a=><button key={a.id} disabled={busy} className="account" onClick={()=>void run({type:"login",id:a.id},()=>location.assign("/app"))}>
    <PatientAvatar userId={a.id}/><span><strong>{a.name}</strong><small>{a.role==="DOCTOR"?"پنل پزشک":"پنل بیمار"}</small></span><ArrowLeft size={18}/></button>)}<ErrorText text={error}/></div>;
}
export function RequestForm() {
  const [chosen,setChosen]=useState<string[]>([]);
  const [descriptions,setDescriptions]=useState<Record<string,string>>({});
  const [photos,setPhotos]=useState<Record<string,File[]>>({});
  const [photoError,setPhotoError]=useState("");
  const [step,setStep]=useState(false);
  const {error,busy,run}=useSubmit();
  return <form className="flow" onSubmit={e=>{
    e.preventDefault(); const fields=new FormData(e.currentTarget);
    if (!step) {setStep(true);return;}
    const concerns=Object.fromEntries(chosen.map(area=>[area,descriptions[area]]));
    const payload={type:"request",areas:chosen,concerns,consent:fields.get("consent")==="on"};
    const goToCase=(data:{id?:string})=>location.assign(chosen.length>1?"/app?view=cases":"/app?case="+data.id);
    const attachments=chosen.flatMap(area=>(photos[area]??[]).map(file=>({area,file})));
    if (!attachments.length) {void run(payload,goToCase);return;}
    const form=new FormData();
    form.set("payload",JSON.stringify(payload));
    for(const {area,file} of attachments) form.append(area,file);
    void run(form,goToCase,"/api/requests");
  }}>
    <h2>{step?"شرح مشکل":"انتخاب پکیج"}</h2>
    {!step ? <fieldset className="packages" aria-label="موضوعات مشاوره">{areas.map(area=>{
      const Icon=packageIcons[area];
      return <label className="package" key={area}>
        <span className="package-icon"><Icon size={20} aria-hidden="true"/></span>
        <strong>{areaLabels[area]}</strong>
        <input type="checkbox" checked={chosen.includes(area)} onChange={e=>setChosen(e.target.checked?[...chosen,area]:chosen.filter(x=>x!==area))}/>
      </label>;
    })}</fieldset>
      : <>
        {chosen.map(area=><section className="request-topic flow" key={area}>
          <label>شرح مشکل {areaLabels[area]}<textarea required rows={3} minLength={10} maxLength={3000} value={descriptions[area]??""} onChange={e=>setDescriptions(prev=>({...prev,[area]:e.target.value}))}/></label>
          <label className="upload upload-compact request-upload"><Paperclip size={16} aria-hidden="true"/> افزودن عکس {areaLabels[area]} (اختیاری)
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e=>{
              const files=Array.from(e.target.files??[]);
              e.target.value="";
              if(!files.length) return;
              const selected=[...(photos[area]??[]),...files];
              const size=chosen.flatMap(key=>key===area?selected:(photos[key]??[])).reduce((sum,file)=>sum+file.size,0);
              if(selected.length>maxInitialPhotos) {setPhotoError("برای هر موضوع حداکثر دو عکس اضافه کنید.");return;}
              if(size>maxImageBytes) {setPhotoError("حجم مجموع عکس‌ها باید حداکثر ۲۵ مگابایت باشد.");return;}
              setPhotos(prev=>({...prev,[area]:selected}));
              setPhotoError("");
            }}/>
          </label>
          {!!photos[area]?.length&&<ul className="request-photo-list">{photos[area].map((file,index)=><li key={`${file.name}-${index}`}>
            <bdi>{file.name}</bdi><button className="btn small" type="button" disabled={busy} aria-label={`حذف عکس ${file.name}`} onClick={()=>{
              setPhotos(prev=>({...prev,[area]:prev[area].filter((_,i)=>i!==index)}));
              setPhotoError("");
            }}>حذف</button>
          </li>)}</ul>}
        </section>)}
        <small>JPEG، PNG یا WebP · حداکثر دو عکس برای هر موضوع و مجموعاً ۲۵ مگابایت</small>
        <ErrorText text={photoError}/>
        <label className="check-option"><input type="checkbox" name="consent" required/><span>شرایط استفاده از حساب و دادهٔ نمایشی را می‌پذیرم.</span></label>
      </>}
    {chosen.length>1&&<p>برای هر موضوع یک پروندهٔ جدا ساخته می‌شود. پس از بررسی درخواست‌ها، مبلغ پکیج یک‌بار پرداخت می‌شود.</p>}
    {chosen.length>0&&<p className="soft">{title(chosen)} · {fa(demoPrice)} تومان · مبلغ نمایشی پکیج</p>}
    <div className="actions"><button className="btn primary" disabled={!chosen.length||busy}>{step?"ثبت درخواست":"ادامه و شرح مشکل"}</button>{step&&<button className="btn" type="button" onClick={()=>setStep(false)}>بازگشت</button>}</div><ErrorText text={error}/>
  </form>;
}

function Uploader({id,episodeId,onFile,compact=false}:{id:string;episodeId?:string;onFile?:(file:Asset)=>void;compact?:boolean}) {
  const {error,busy,run}=useSubmit();
  return <div><label className={compact?"upload upload-compact":"upload"}>{compact?<Paperclip size={16} aria-hidden="true"/>:<Upload size={19} aria-hidden="true"/>}{busy?"در حال بارگذاری…":compact?"پیوست تصویر":"افزودن تصویر"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{
    const file=e.target.files?.[0];if(!file)return;
    const form=new FormData();form.set("caseId",id);form.set("file",file);if(episodeId)form.set("episodeId",episodeId);
    void run(form,data=>{if(data.id&&data.filename)onFile?.({id:data.id,filename:data.filename});});
    e.target.value="";
  }}/></label><ErrorText text={error}/></div>;
}
export type IntakeValues = {history?:string;duration?:string;goal?:string;height?:string;weight?:string};
export function Intake({id,initial,areas}:{id:string;initial:IntakeValues;areas:string[]}) {
  const {error,busy,run}=useSubmit();
  return <div className="flow"><Uploader id={id}/><form className="flow" onSubmit={e=>{
    e.preventDefault();const fields=new FormData(e.currentTarget);
    const button=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    void run({type:"intake",id,history:fields.get("history"),duration:fields.get("duration")??"",goal:fields.get("goal")??"",height:fields.get("height")??"",weight:fields.get("weight")??"",submit:button.value==="submit"});
  }}>{areas.some(area=>area!=="DIET")&&<label>مدت مشکل<input name="duration" defaultValue={initial.duration} maxLength={150}/></label>}
  {areas.includes("DIET")&&<><label>هدف پیگیری تغذیه<textarea name="goal" defaultValue={initial.goal} maxLength={1000}/></label><div className="actions"><label>قد (سانتی‌متر)<input type="number" name="height" min="1" step="any" defaultValue={initial.height}/></label><label>وزن (کیلوگرم)<input type="number" name="weight" min="1" step="any" defaultValue={initial.weight}/></label></div></>}
  <label>شرح حال، داروها و اطلاعات تکمیلی<textarea name="history" defaultValue={initial.history} rows={4} maxLength={5000}/></label>
  <div className="actions"><button className="btn primary" value="submit" disabled={busy}>ارسال برای بررسی</button><button className="btn" value="draft" disabled={busy}>ذخیرهٔ پیش‌نویس</button></div><ErrorText text={error}/></form></div>;
}

export function Photos({files,allowRemove=false}:{files:Asset[];allowRemove?:boolean}) {
  const {error,busy,run}=useSubmit();
  const [id,setId]=useState("");
  const [zoom,setZoom]=useState(1);
  const current=files.find(f=>f.id===id)??files[0];
  if(!current)return <div className="photo-empty"><ImagePlus size={32}/><strong>هنوز تصویری ثبت نشده</strong><span>پیش‌نمایش تصاویر پرونده اینجا نمایش داده می‌شود.</span></div>;
  const path="/api/files/"+current.id;
  return <div className="photo">
    <div className="toolbar"><span dir="ltr">{current.filename}</span><div className="actions"><button type="button" aria-label="کاهش بزرگ‌نمایی" onClick={()=>setZoom(Math.max(1,zoom-.25))}>−</button><span>{fa(zoom*100)}٪</span><button type="button" aria-label="افزایش بزرگ‌نمایی" onClick={()=>setZoom(Math.min(3,zoom+.25))}>+</button><a aria-label="نمایش تصویر اصلی" href={path+"?variant=original"} target="_blank" rel="noreferrer"><Expand size={17}/></a></div></div>
    <div className="photo-window"><img alt="تصویر خصوصی پرونده" src={path+(zoom>1?"?variant=original":"")} style={{width:zoom*100+"%"}}/></div>
    <div className="thumbnails">{files.map(file=><button type="button" aria-label={file.filename} className={file.id===current.id?"selected":""} key={file.id} onClick={()=>{setId(file.id);setZoom(1);}}><img alt="" src={"/api/files/"+file.id}/></button>)}</div>
    <a className="original" href={path+"?variant=original"} target="_blank" rel="noreferrer">مشاهدهٔ تصویر با کیفیت اصلی <Expand size={14}/></a>{allowRemove&&<button className="btn small" disabled={busy} onClick={()=>void run({type:"remove-file",id:current.id})}>حذف تصویر</button>}<ErrorText text={error}/>
  </div>;
}
export function Note({id,value}:{id:string;value:string}) {
  const {error,busy,run}=useSubmit();
  return <form className="flow" onSubmit={e=>{e.preventDefault();void run({type:"note",id,body:new FormData(e.currentTarget).get("body")});}}>
    <label>یادداشت خصوصی پزشک<textarea rows={4} name="body" maxLength={5000} defaultValue={value}/></label><button className="btn" disabled={busy}>ذخیرهٔ یادداشت</button><ErrorText text={error}/>
  </form>;
}
export function Composer({id,episodeId,initialFiles,allowUrgent=false,urgentOnly=false}:{id:string;episodeId:string;initialFiles:Asset[];allowUrgent?:boolean;urgentOnly?:boolean}) {
  const [body,setBody]=useState("");
  const [files,setFiles]=useState<Asset[]>(initialFiles);
  const [urgent,setUrgent]=useState(false);
  const clientId=useRef("");
  const {error,busy,run}=useSubmit();
  return <div className="chat-composer flow">
    {files.length>0&&<div className="soft">{files.map(f=>f.filename).join("، ")}</div>}
    <form className="flow" onSubmit={e=>{e.preventDefault();clientId.current ||= crypto.randomUUID();void run({type:"message",id,episodeId,clientId:clientId.current,body,files:files.map(f=>f.id),urgent:urgentOnly||urgent},()=>{setBody("");setFiles([]);setUrgent(false);clientId.current="";});}}>
      <textarea aria-label="متن پیام" dir="auto" rows={2} placeholder="پیام خود را بنویسید…" value={body} maxLength={5000} onChange={e=>setBody(e.target.value)}/>
      <div className="composer-actions">
        <div className="actions">
          {!urgentOnly&&<Uploader compact id={id} episodeId={episodeId} onFile={file=>setFiles(prev=>[...prev,file])}/>}
          {allowUrgent&&!urgentOnly&&<label className="check-option"><input type="checkbox" checked={urgent} onChange={e=>setUrgent(e.target.checked)}/><span>مورد ضروری</span></label>}
        </div>
        <button className="btn primary" disabled={busy||(!body.trim()&&!files.length)}>{urgentOnly||urgent?"ارسال مورد ضروری":"ارسال پیام"} <Send size={16} aria-hidden="true"/></button>
      </div>
    </form><ErrorText text={error}/></div>;
}
export function MessageControls({id,messageId,body}:{id:string;messageId:string;body:string}) {
  const [mode,setMode]=useState<"edit"|"delete"|null>(null);
  const {error,busy,run}=useSubmit();
  const menu=useRef<HTMLDetailsElement>(null);
  const finish=()=>{
    setMode(null);
    if(menu.current) menu.current.open=false;
  };

  return <details className="message-controls" ref={menu}>
    <summary aria-label="گزینه‌های پیام" title="گزینه‌های پیام"><Ellipsis size={19} aria-hidden="true"/></summary>
    {mode==="edit"?<form className="flow" onSubmit={event=>{
      event.preventDefault();
      void run({type:"edit-message",id,messageId,body:new FormData(event.currentTarget).get("body")},finish);
    }}>
      <label>متن جدید<textarea name="body" rows={3} defaultValue={body} required maxLength={5000}/></label>
      <div className="actions"><button className="btn primary small" disabled={busy}>ذخیرهٔ ویرایش</button><button type="button" className="btn small" disabled={busy} onClick={finish}>انصراف</button></div>
    </form>:mode==="delete"?<div className="flow">
      <p>این پیام و پیوست‌هایش برای هر دو طرف حذف می‌شود.</p>
      <div className="actions"><button type="button" className="btn small message-delete" disabled={busy} onClick={()=>void run({type:"delete-message",id,messageId},finish)}>تأیید حذف</button><button type="button" className="btn small" disabled={busy} onClick={finish}>انصراف</button></div>
    </div>:<div className="actions">
      <button type="button" className="btn small" onClick={()=>setMode("edit")}>ویرایش پیام</button>
      <button type="button" className="btn small message-delete" onClick={()=>setMode("delete")}>حذف پیام</button>
    </div>}
    <ErrorText text={error}/>
  </details>;
}
export function Refresh() {
  const router=useRouter();
  useEffect(()=>{
    const timer=setInterval(()=>{if(document.visibilityState==="visible")router.refresh();},20000);
    return ()=>clearInterval(timer);
  },[router]);
  return <button className="btn small" onClick={()=>router.refresh()}>به‌روزرسانی</button>;
}
export function RegisterWorker() {
  useEffect(()=>{if("serviceWorker" in navigator)void navigator.serviceWorker.register("/sw.js").catch(()=>{});},[]);
  return null;
}
export function ReadyMark({ready}:{ready:boolean}) {return <span className={ready?"soft success":"soft"}><Check size={15}/>{ready?"پرونده آماده است":"در انتظار تکمیل"}</span>;}
