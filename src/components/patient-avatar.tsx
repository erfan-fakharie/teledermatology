import Image from "next/image";
import { UserRound } from "lucide-react";
import { demoPatientProfile } from "@/lib/demo-patient-profiles";

export default function PatientAvatar({ userId, size = 40 }: { userId: string; size?: number }) {
  const profile = demoPatientProfile(userId);
  return <span className="patient-avatar" style={{ width: size, height: size }} aria-hidden="true">
    {profile
      ? <Image src={profile.avatar} alt="" width={size} height={size} sizes={`${size}px`} />
      : <UserRound size={Math.round(size * .52)} />}
  </span>;
}
