import PublicPage from '@/app/page'

export default async function ConventionDayPage({ params }: { params: Promise<{ id: string; day: string }> }) {
  const { id, day } = await params
  return <PublicPage initialTab="conventions" initialConventionId={id} initialDay={day} />
}
