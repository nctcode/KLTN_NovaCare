import { redirect } from 'next/navigation';

export default function InteropAuditPage() {
  redirect('/admin/interoperability?tab=audit');
}
