import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '문의하기',
  description: '사주로아의 상담 신청, 사이트 이용 문의, 콘텐츠 오류 제보와 개인정보 관련 문의 방법입니다.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold" style={{ color: '#1E2D4D' }}>문의하기</h1>
      <div className="space-y-8 text-sm leading-8 text-gray-700">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">사이트 이용 및 콘텐츠 문의</h2>
          <p>운영자 로아에게 사주로아 인스타그램 계정의 메시지로 문의할 수 있습니다.</p>
          <a href="https://www.instagram.com/saju.roa/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full border border-gray-300 px-5 py-2 font-medium text-gray-900">
            인스타그램 @saju.roa로 문의하기
          </a>
          <p className="mt-3">오류 제보에는 문제가 발생한 페이지 주소와 상황을, 글의 정정 요청에는 해당 문장과 확인 가능한 참고 자료를 함께 보내주세요.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">개별 사주 상담</h2>
          <p>개별 사주 풀이와 고민 상담은 <Link href="/counsel" className="underline">1:1 비공개 상담 안내</Link>를 확인한 뒤 신청해 주세요. 상담은 유료이며, 결제 안내를 확인한 후 진행합니다.</p>
          <p className="mt-3">이미 신청한 상담은 로그인 후 <Link href="/mypage/counsel" className="underline">내 상담글</Link>에서 확인할 수 있습니다.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">개인정보 관련 요청</h2>
          <p>개인정보 열람·정정·삭제 등 요청도 위 문의 경로로 접수할 수 있습니다. 비밀번호나 주민등록번호는 보내지 마세요. 사주 정보 수정과 회원 탈퇴는 마이페이지에서 직접 진행할 수 있습니다.</p>
          <p className="mt-3"><Link href="/privacy" className="underline">개인정보처리방침 보기</Link></p>
        </section>
      </div>
    </div>
  )
}
