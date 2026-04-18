import { redirect } from 'next/navigation'

export default async function AdminCounselDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/counsel/${id}`)
}
