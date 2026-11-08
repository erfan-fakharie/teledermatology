export const areas = ["SKIN", "HAIR", "DIET"] as const;
export const demoPrice = 10_000_000;
export const maxImageBytes = 25 * 1024 * 1024;
export const maxInitialPhotos = 2;
export const areaLabels: Record<string,string> = { SKIN: "پوست", HAIR: "مو", DIET: "تغذیه" };
export const labels: Record<string,string> = {
  PENDING_REVIEW:"در انتظار بررسی", AWAITING_PAYMENT:"در انتظار پرداخت", REJECTED:"رد شده",
  PACKAGE_PENDING:"در انتظار بررسی پکیج",
  QUEUED:"در صف", WAITING:"در انتظار فراخوانی", PREPARING:"تکمیل اطلاعات", READY:"آماده بررسی",
  IN_INITIAL_CONSULTATION:"در حال بررسی", IN_PROGRESS:"در حال بررسی", ON_HOLD:"موکول شده", DONE:"پایان یافته", FOLLOWUP_PERIOD:"دورهٔ پیگیری",
  CLOSED:"بسته", OPEN:"باز", SCHEDULED:"در انتظار موعد",
};
export const demoAccounts = [
  {id:"doctor_demo", name:"پزشک نمونه", role:"DOCTOR"},
  {id:"patient_new", name:"سارا رضایی", role:"PATIENT"},
  {id:"patient_queue", name:"مریم احمدی", role:"PATIENT"},
  {id:"patient_followup", name:"علی محمدی", role:"PATIENT"},
  {id:"patient_chat", name:"نیلوفر کریمی", role:"PATIENT"},
] as const;
export const fa = (n: number | bigint) => new Intl.NumberFormat("fa-IR").format(n);
export const title = (values: string[]) => values.map(v=>areaLabels[v]).join(" و ");
