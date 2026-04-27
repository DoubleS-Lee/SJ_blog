export const metadata = {
  title: '개인정보처리방침',
  description: '사주로아의 사주이야기 개인정보처리방침입니다.',
}

const EFFECTIVE_DATE = '2026년 4월 12일'

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">개인정보처리방침</h1>
      <p className="mb-12 text-sm text-gray-400">시행일: {EFFECTIVE_DATE}</p>

      <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-base font-semibold">1. 개인정보 처리 목적 및 수집 항목</h2>
          <p className="mb-3 text-gray-600">
            사주로아의 사주이야기(이하 &quot;서비스&quot;)는 다음과 같은 목적을 위해 개인정보를
            수집하고 처리합니다.
          </p>
          <table className="w-full border-collapse border border-gray-200 text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium">처리 목적</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium">수집 항목</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium">보유기간</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr>
                <td className="border border-gray-200 px-3 py-2">회원 가입 및 관리</td>
                <td className="border border-gray-200 px-3 py-2">이메일(선택), 닉네임, 소셜 계정 연계 정보</td>
                <td className="border border-gray-200 px-3 py-2">회원 탈퇴 시까지</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">사주 분석 서비스 제공</td>
                <td className="border border-gray-200 px-3 py-2">
                  생년월일, 출생시(선택), 성별, 양력/음력 구분
                </td>
                <td className="border border-gray-200 px-3 py-2">회원 탈퇴 시까지</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">서비스 이용 기록 관리</td>
                <td className="border border-gray-200 px-3 py-2">
                  세션 식별값, 서비스 이용 기록(자동 수집)
                </td>
                <td className="border border-gray-200 px-3 py-2">3개월</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">2. 개인정보의 제3자 제공</h2>
          <p className="text-gray-600">
            서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 이용자의 동의가
            있거나 법령에 따른 경우에 한해 예외적으로 제공될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">3. 개인정보 처리 위탁</h2>
          <div className="space-y-2 text-gray-600">
            <p>서비스 제공을 위해 아래 업체에 개인정보 처리를 위탁합니다.</p>
            <table className="mt-2 w-full border-collapse border border-gray-200 text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">수탁업체</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">위탁 업무</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Supabase Inc.</td>
                  <td className="border border-gray-200 px-3 py-2">데이터베이스 및 인증 서비스 운영</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Vercel Inc.</td>
                  <td className="border border-gray-200 px-3 py-2">웹 서비스 호스팅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">4. 이용자의 권리·의무 및 행사 방법</h2>
          <p className="mb-2 text-gray-600">
            이용자는 언제든지 자신의 개인정보에 대해 아래 권리를 행사할 수 있습니다.
          </p>
          <ul className="list-inside list-disc space-y-1 text-gray-600">
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구(회원 탈퇴)</li>
            <li>처리 정지 요구</li>
          </ul>
          <p className="mt-2 text-gray-600">
            마이페이지에서 직접 사주 정보를 수정하거나 회원 탈퇴를 진행할 수 있습니다. 그 외 요청은
            아래 개인정보 보호책임자 문의처로 연락해 주세요.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">5. 개인정보 파기</h2>
          <p className="text-gray-600">
            서비스는 개인정보 보유기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 해당
            개인정보를 파기합니다. 회원 탈퇴 시 계정 및 사주 정보는 즉시 삭제되며, 서비스 이용
            기록은 최대 3개월 보관 후 자동 삭제됩니다. 다만 법령에 따라 별도 보관이 필요한 정보는
            해당 기간 동안 보관 후 파기합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">6. 쿠키 사용</h2>
          <p className="text-gray-600">
            서비스는 로그인 상태 유지와 서비스 개선을 위해 쿠키를 사용할 수 있습니다. 브라우저
            설정에서 쿠키 저장을 거부할 수 있으나, 일부 기능 이용에 제한이 있을 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">7. 개인정보 보호책임자</h2>
          <div className="rounded-md bg-gray-50 p-4 text-xs text-gray-600">
            <p>
              <span className="font-medium">담당자:</span> 사주로아의 사주이야기 운영팀
            </p>
            <p className="mt-1">
              <span className="font-medium">문의:</span> 서비스 내 문의 기능 또는 인스타그램
              @saju.roa
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">8. 개인정보처리방침 변경</h2>
          <p className="text-gray-600">
            본 방침은 {EFFECTIVE_DATE}부터 시행됩니다. 중요한 변경이 있을 경우 시행 최소 7일
            전에 서비스 공지사항 등을 통해 안내합니다.
          </p>
        </section>
      </div>
    </div>
  )
}
