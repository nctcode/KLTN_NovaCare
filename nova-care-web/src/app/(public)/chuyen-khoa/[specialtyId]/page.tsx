import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    specialtyId: string;
  }>;
}

export default async function SpecialtyPage({ params }: PageProps) {
  const { specialtyId } = await params;
  redirect(`/dat-kham-chuyen-khoa/${specialtyId}`);
}
