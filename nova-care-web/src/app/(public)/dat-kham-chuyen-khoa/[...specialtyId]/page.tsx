import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    specialtyId: string | string[];
  }>;
}

export default async function DatKhamChuyenKhoaRedirectPage({ params }: PageProps) {
  const resolved = await params;
  const id = Array.isArray(resolved.specialtyId) ? resolved.specialtyId.join('-') : resolved.specialtyId;
  redirect(`/dat-kham-co-so?specialtyId=${id}&mode=general`);
}
