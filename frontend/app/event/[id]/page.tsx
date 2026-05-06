import PublicPage from '@/app/page'

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PublicPage initialTab="lessons" initialEventId={id} />
}
