import { redirect } from 'next/navigation';

export default function InteropLookupsPage() {
  redirect('/admin/interoperability?tab=lookups');
}
