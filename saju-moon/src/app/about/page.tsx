import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '사주로아 소개',
  description: '사주로아의 운영 목적과 공개 콘텐츠, 맞춤 판정의 이용 방법 및 해석의 한계를 안내합니다.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold" style={{ color: '#1E2D4D' }}>사주로아 소개</h1>
      <div className="space-y-8 text-sm leading-8 text-gray-700">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">이 글이 내 사주에도 해당할까요?</h2>
          <p>
            사주로아는 사주 콘텐츠를 읽은 뒤 남는 이 질문에서 시작했습니다. 운영자 로아가 명리학의
            개념을 설명하는 글과 사주 정보에 따른 맞춤 판정을 연결해, 독자가 해석의 조건을 확인할 수 있는 공간을 만들었습니다.
          </p>
          <p className="mt-3">
            연애와 관계, 일과 진로, 재물에 대한 태도, 가족과 일상 등 여러 주제를 다룹니다.
            하나의 글로 운명을 확정하기보다 자신의 경험과 선택을 돌아보는 읽을거리를 제공하고자 합니다.
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">콘텐츠와 맞춤 판정 이용하기</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li><Link href="/" className="underline">블로그</Link>에서 관심 있는 주제의 글을 선택합니다. 본문은 로그인 없이 읽을 수 있습니다.</li>
            <li>맞춤 판정을 이용하려면 로그인 후 생년월일, 달력 구분과 출생 시간 등을 입력합니다.</li>
            <li>판정 조건이 등록된 글에서는 저장한 사주와 해당 조건을 비교합니다. 조건에 해당한다는 표시는 실제 사건이나 결과가 보장된다는 뜻이 아닙니다.</li>
            <li>개별 상황을 설명하고 의견을 받고 싶다면 <Link href="/counsel" className="underline">비공개 상담 안내</Link>를 확인하세요.</li>
          </ol>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">해석을 읽을 때 알아두세요</h2>
          <p>
            사주와 명리학은 전통적인 해석 체계입니다. 생년월일이나 오행만으로 질병, 투자 수익,
            타인의 감정 또는 미래의 사건을 확정할 수 없습니다. 글에 나오는 유형은 개인의 모든 특성을 설명하지 않습니다.
          </p>
          <p className="mt-3">
            건강 문제는 의료진에게, 투자·법률 문제는 해당 분야 전문가에게 확인하세요.
            중요한 결정은 실제 상황과 검증 가능한 정보를 함께 살펴 판단해야 합니다.
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">운영 및 문의</h2>
          <p>운영: 사주로아 · 로아</p>
          <p>
            글의 설명이 불명확하거나 잘못된 내용을 발견하셨다면 해당 글 주소와 함께
            <Link href="/contact" className="ml-1 underline">문의 페이지</Link>에 안내된 연락처로 알려주세요.
            개인정보 처리와 서비스 이용 범위는 <Link href="/privacy" className="underline">개인정보처리방침</Link>과
            <Link href="/terms" className="ml-1 underline">이용약관</Link>에서 확인할 수 있습니다.
          </p>
        </section>
      </div>
    </div>
  )
}
