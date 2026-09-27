import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MenuHero from '@/components/layout/MenuHero'
import { getCurrentUserAdminState } from '@/lib/auth/admin'

export const metadata: Metadata = {
  title: '후기 | 사주로아',
  description: '사주로아 상담을 경험하신 분들의 생생한 후기를 확인해 보세요.',
  robots: { index: false, follow: false },
}

const HERO_PALETTE = {
  borderClass: '',
  gradientClass: '',
  eyebrowClass: '',
}

export default async function ReviewsPage() {
  const { isAdmin } = await getCurrentUserAdminState()
  if (!isAdmin) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MenuHero
        eyebrow="Reviews"
        title="후기"
        description={`사주로아의 1:1 프라이빗 사주 상담을 경험하신 분들의 생생한 후기입니다.
실제 상담 내용을 바탕으로 작성된 진솔한 이야기를 확인해 보세요.`}
        palette={HERO_PALETTE}
      />
    </div>
  )
}
