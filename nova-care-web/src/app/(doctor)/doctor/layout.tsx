import { DoctorPortalShell } from '@/components/doctor/DoctorPortalShell';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <DoctorPortalShell>{children}</DoctorPortalShell>;
}
