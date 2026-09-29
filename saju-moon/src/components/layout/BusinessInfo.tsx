import { BUSINESS } from '@/lib/business'

export default function BusinessInfo() {
  return (
    <div className="space-y-2 text-sm leading-7">
      <p>{BUSINESS.description}</p>
      <dl className="flex flex-wrap gap-x-5 gap-y-1">
        <div className="flex gap-2">
          <dt className="font-medium">서비스명</dt>
          <dd>{BUSINESS.brandName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">운영 사업자(상호)</dt>
          <dd>{BUSINESS.legalName}</dd>
        </div>
        {BUSINESS.registrationNumber ? (
          <div className="flex gap-2">
            <dt className="font-medium">사업자등록번호</dt>
            <dd>{BUSINESS.registrationNumber}</dd>
          </div>
        ) : null}
      </dl>
      <p>
        제공 서비스: 사주·명리학 콘텐츠, 사주 정보에 따른 맞춤 판정, 만세력 조회, 궁합 분석, 1:1 비공개 사주 상담
      </p>
    </div>
  )
}
