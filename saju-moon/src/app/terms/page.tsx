export const metadata = {
  title: '이용약관',
  description: '사주로아의 사주이야기 서비스 이용약관입니다.',
}

const EFFECTIVE_DATE = '2026년 4월 12일'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">이용약관</h1>
      <p className="mb-12 text-sm text-gray-400">시행일: {EFFECTIVE_DATE}</p>

      <div className="space-y-8 text-sm leading-7 text-gray-700">
        <section>
          <h2 className="mb-3 text-base font-semibold text-black">1. 서비스 소개</h2>
          <p>
            사주로아의 사주이야기는 사주 기반 콘텐츠와 개인화된 해석 경험을 제공하는 온라인 서비스입니다.
            회원은 본 약관과 관련 운영 정책을 준수하는 범위에서 서비스를 이용할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-black">2. 회원가입 및 계정</h2>
          <p>
            회원가입과 로그인은 제공되는 소셜 로그인 수단을 통해 진행됩니다. 회원은 본인 계정을 직접 관리해야
            하며, 계정 사용에 대한 책임은 회원 본인에게 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-black">3. 서비스 이용 원칙</h2>
          <p>
            서비스에서 제공되는 해석과 콘텐츠는 정보 제공을 위한 것이며, 법률, 의료, 투자 등 전문적 판단을
            대체하지 않습니다. 운영자는 서비스 안정성과 품질 향상을 위해 기능을 수정하거나 중단할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-black">4. 이용 제한</h2>
          <p>
            회원은 서비스 운영을 방해하거나 타인의 권리를 침해하는 방식으로 서비스를 이용할 수 없습니다.
            운영자는 관련 법령 또는 약관 위반이 확인될 경우 서비스 이용을 제한할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-black">5. 개인정보 보호</h2>
          <p>
            개인정보 처리에 관한 자세한 내용은 개인정보처리방침을 따릅니다. 회원은 서비스 이용 과정에서 필요한
            범위의 정보 제공에 동의해야 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-black">6. 문의</h2>
          <p>서비스 이용 중 문의가 필요한 경우, 사이트 하단에 안내된 이메일을 통해 연락할 수 있습니다.</p>
        </section>
      </div>
    </div>
  )
}
