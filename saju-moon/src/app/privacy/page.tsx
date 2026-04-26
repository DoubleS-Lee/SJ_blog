export const metadata = {
  title: '개인정보 처리방침',
  description: '월덕요정의 사주이야기의 개인정보 처리방침입니다.',
}

const EFFECTIVE_DATE = '2026년 4월 12일'

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight mb-2">개인정보 처리방침</h1>
      <p className="text-sm text-gray-400 mb-12">시행일: {EFFECTIVE_DATE}</p>

      <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-8">

        <section>
          <h2 className="text-base font-semibold mb-3">1. 개인정보 처리목적 및 수집 항목</h2>
          <p className="text-gray-600 mb-3">
            월덕요정의 사주이야기(이하 &quot;서비스&quot;)은 다음과 같은 목적으로 개인정보를 수집·처리합니다.
          </p>
          <table className="w-full text-xs border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium">처리목적</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium">수집 항목</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium">보유기간</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr>
                <td className="border border-gray-200 px-3 py-2">회원 가입 및 관리</td>
                <td className="border border-gray-200 px-3 py-2">이메일(선택), 닉네임, 소셜 계정 식별자</td>
                <td className="border border-gray-200 px-3 py-2">회원 탈퇴 시까지</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">사주 분석 서비스 제공</td>
                <td className="border border-gray-200 px-3 py-2">생년월일, 생시(선택), 성별, 양·음력 구분</td>
                <td className="border border-gray-200 px-3 py-2">회원 탈퇴 시까지</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">서비스 이용 기록 관리</td>
                <td className="border border-gray-200 px-3 py-2">접속 IP, 서비스 이용 기록(자동 수집)</td>
                <td className="border border-gray-200 px-3 py-2">3개월</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">2. 개인정보의 제3자 제공</h2>
          <p className="text-gray-600">
            서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 이용자의 동의가 있거나 법령에 의한 경우는 예외로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">3. 개인정보 처리 위탁</h2>
          <div className="text-gray-600 space-y-2">
            <p>서비스 제공을 위해 아래 업체에 개인정보 처리를 위탁합니다.</p>
            <table className="w-full text-xs border-collapse border border-gray-200 mt-2">
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
          <h2 className="text-base font-semibold mb-3">4. 이용자의 권리·의무 및 행사 방법</h2>
          <p className="text-gray-600 mb-2">
            이용자는 언제든지 자신의 개인정보에 대해 다음의 권리를 행사할 수 있습니다.
          </p>
          <ul className="text-gray-600 list-disc list-inside space-y-1">
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구 (마이페이지 → 회원 탈퇴)</li>
            <li>처리 정지 요구</li>
          </ul>
          <p className="text-gray-600 mt-2">
            마이페이지에서 직접 사주 정보 수정 및 회원 탈퇴가 가능합니다.
            기타 요청은 아래 개인정보 보호책임자에게 문의해 주세요.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">5. 개인정보의 파기</h2>
          <p className="text-gray-600">
            서비스는 개인정보 보유 기간의 경과 또는 처리 목적 달성 등으로 인해
            개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
            회원 탈퇴 시 관련 개인정보는 즉시 삭제되며, 법령에 따라 보존이 필요한
            정보는 해당 기간 동안 보관 후 파기합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">6. 쿠키 사용</h2>
          <p className="text-gray-600">
            서비스는 로그인 상태 유지를 위해 쿠키를 사용합니다.
            브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 서비스 일부 기능에
            제한이 생길 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">7. 개인정보 보호책임자</h2>
          <div className="text-gray-600 bg-gray-50 rounded-md p-4 text-xs">
            <p><span className="font-medium">담당자:</span> 월덕요정의 사주이야기 운영자</p>
            <p className="mt-1"><span className="font-medium">문의:</span> 서비스 내 문의 기능 또는 인스타그램 @saju_moonfairy</p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">8. 개인정보 처리방침 변경</h2>
          <p className="text-gray-600">
            본 방침은 {EFFECTIVE_DATE}부터 시행됩니다.
            내용 변경 시 시행 7일 전부터 서비스 내 공지사항을 통해 알려드립니다.
          </p>
        </section>

      </div>
    </div>
  )
}
