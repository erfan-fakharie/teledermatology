import { demoPatientProfile } from "@/lib/demo-patient-profiles";
import { fa } from "@/lib/catalog";
import PatientAvatar from "./patient-avatar";

export default function PatientProfile({ userId, name }: { userId: string; name: string }) {
  const profile = demoPatientProfile(userId);
  return <section className="patient-profile-card" aria-label={`پروفایل ${name}`}>
    <div className="patient-profile-heading"><PatientAvatar userId={userId} size={88} /><div><h2>{name}</h2><span className="demo">بیمار آزمایشی</span></div></div>
    {profile && <dl className="patient-profile-facts">
      <div><dt>سن</dt><dd>{fa(profile.age)} سال</dd></div>
      <div><dt>شهر</dt><dd>{profile.city}</dd></div>
      <div><dt>شناسهٔ بیمار</dt><dd><bdi>{profile.patientCode}</bdi></dd></div>
    </dl>}
    <p className="patient-profile-caption">تصویر و مشخصات این پروفایل ساختگی و مخصوص نمایش سامانه هستند.</p>
  </section>;
}
