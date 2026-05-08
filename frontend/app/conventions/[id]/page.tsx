import PublicPage from '@/app/page'

export default async function ConventionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PublicPage initialTab="conventions" initialConventionId={id} />
}
