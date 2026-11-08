// Fictional identities for the four demo accounts. These are not clinical data.
export type DemoPatientProfile = {
  avatar: string;
  age: number;
  city: string;
  patientCode: string;
};

const profiles: Record<string, DemoPatientProfile> = {
  patient_new: { avatar: "/demo-patients/patient_new.png", age: 28, city: "تهران", patientCode: "MS-1001" },
  patient_queue: { avatar: "/demo-patients/patient_queue.png", age: 39, city: "شیراز", patientCode: "MS-1002" },
  patient_followup: { avatar: "/demo-patients/patient_followup.png", age: 35, city: "اصفهان", patientCode: "MS-1003" },
  patient_chat: { avatar: "/demo-patients/patient_chat.png", age: 31, city: "رشت", patientCode: "MS-1004" },
};

export function demoPatientProfile(userId: string): DemoPatientProfile | undefined {
  return Object.hasOwn(profiles, userId) ? profiles[userId] : undefined;
}
