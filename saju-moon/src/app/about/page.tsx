import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import BusinessInfo from '@/components/layout/BusinessInfo'

export const metadata: Metadata = {
  title: '사주로아 소개',
  description: '안녕하세요, 로아입니다. 명리의 언어를 일상의 말로 풀어내는 사주로아의 이야기와 상담 철학, 월덕브랜드연구소의 운영 정보를 소개합니다.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-navy sm:px-6 sm:py-16">
      <section aria-labelledby="about-title" className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <p className="mb-5 text-xs font-medium tracking-[0.2em] text-gold-deep">사주로아 소개 · ABOUT ROA</p>
          <h1 id="about-title" className="font-myeongjo text-4xl leading-snug font-bold tracking-tight sm:text-5xl">안녕하세요,<br />로아입니다.</h1>
          <p className="mt-6 text-xl leading-relaxed sm:text-2xl">당신의 이야기를 듣고,<br />나다운 선택을 함께 찾아가요.</p>
          <div className="mt-5 max-w-lg space-y-4 text-sm leading-8 text-[#4a5673] sm:text-base">
            <p>연애도, 일도, 마음처럼 풀리지 않는 날이 있죠. 어디서부터 이야기해야 할지 막막할 때, 편하게 들를 수 있는 공간이 되었으면 해요.</p>
            <p>저는 명리의 언어를 일상에서 이해할 수 있는 말로 풀어내고 있어요. 타고난 기질과 지금의 상황을 함께 살피며, 스스로를 조금 더 이해할 수 있도록 곁에서 돕겠습니다.</p>
          </div>
          <ul aria-label="로아의 자격" className="mt-6 flex flex-wrap gap-2 text-xs text-[#4a5673]">
            <li className="rounded-full border border-gold-line/60 bg-ivory-card px-3 py-2">명리심리상담사 1급</li>
            <li className="rounded-full border border-gold-line/60 bg-ivory-card px-3 py-2">직업상담사 2급</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/counsel" className="inline-flex min-h-12 items-center rounded-full bg-navy px-6 text-white transition-colors hover:bg-navy-deep">로아와 상담하기 ↗</Link>
            <Link href="/" className="inline-flex min-h-12 items-center rounded-full border border-navy/20 px-6 transition-colors hover:bg-ivory-card">글부터 둘러보기</Link>
          </div>
        </div>
        <figure className="mx-auto w-full max-w-sm lg:max-w-none">
          <div className="overflow-hidden rounded-t-[8rem] rounded-b-3xl border border-gold-line/40 bg-ivory-card p-2 sm:rounded-t-[10rem]">
            <Image src="/images/profile-sajuroa.png" alt="미소 짓는 사주로아 상담사 로아의 상반신 프로필" width={1207} height={1303} sizes="(min-width: 1024px) 440px, 384px" loading="eager" className="aspect-[5/4] h-auto w-full rounded-t-[7.5rem] rounded-b-2xl object-cover object-top sm:rounded-t-[9.5rem]" />
          </div>
          <figcaption className="mt-4 text-center text-sm text-[#6f685b]">이야기를 듣고, 함께 생각하는 사람 · 로아</figcaption>
        </figure>
      </section>
      <section aria-labelledby="philosophy-title" className="mt-16 rounded-3xl border border-gold-line/40 bg-ivory-card px-6 py-9 sm:mt-24 sm:px-12 sm:py-12">
        <p className="mb-3 text-xs font-medium tracking-widest text-gold-deep">로아가 사주를 바라보는 마음</p>
        <h2 id="philosophy-title" className="font-myeongjo text-2xl leading-relaxed font-bold sm:text-3xl">사주는 나를 이해하는<br className="sm:hidden" /> 하나의 지도라고 생각해요.</h2>
        <div className="mt-6 grid gap-5 text-sm leading-8 text-[#4a5673] sm:grid-cols-2 sm:gap-10 sm:text-base">
          <p>내가 어떤 상황에서 힘을 얻는지, 어떤 관계에서 비슷한 고민을 반복하는지. 사주를 통해 나의 패턴과 지금 쓸 수 있는 강점을 함께 살펴봐요.</p>
          <p>이야기를 나눈 뒤에는 지금 무엇을 생각하고, 어떤 작은 행동부터 해볼 수 있을지 조금 더 선명해졌으면 해요. 당신의 상황과 속도를 존중하며 함께 정리하겠습니다.</p>
        </div>
      </section>
      <div className="mx-auto mt-16 max-w-4xl space-y-14 text-sm leading-8 text-[#4a5673] sm:mt-24 sm:space-y-20">
        <section>
          <p className="mb-3 text-xs font-medium tracking-widest text-gold-deep">편한 곳에서 시작해요</p>
          <h2 className="font-myeongjo text-2xl font-bold text-navy sm:text-3xl">지금의 나에게 필요한 만큼.</h2>
          <p className="mt-4">가볍게 글을 읽어도, 내 사주를 들여다봐도 좋아요. 조금 더 깊이 나누고 싶은 이야기가 있다면 상담으로 만나주세요.</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {[
              { href: '/', label: '사주 콘텐츠 · 맞춤 판정', title: '글로 천천히 알아가기', text: '연애, 일, 재물, 일상 속 나의 모습을 글로 만나보세요. 로그인하면 내 사주가 글의 해석 조건에 해당하는지도 확인할 수 있어요.' },
              { href: '/manseryeok', label: '만세력 조회', title: '내 사주의 기본부터', text: '생년월일시와 양력·음력 구분을 입력해 내 사주를 살펴보세요. 나를 이해하는 첫걸음을 함께 시작해요.' },
              { href: '/compatibility', label: '궁합 분석', title: '서로를 조금 더 이해하기', text: '내 사주와 저장한 상대방의 사주를 비교해 보세요. 관계 속에서 닮은 점과 다른 점을 돌아보는 계기가 될 수 있어요.' },
              { href: '/counsel', label: '1:1 비공개 사주 상담', title: '나의 이야기를 나누고 싶다면', text: '혼자 정리하기 어려운 고민을 남겨주세요. 사주 정보와 지금의 상황을 함께 살피며 로아가 텍스트로 답변드려요.' },
            ].map((service) => (
              <Link key={service.href} href={service.href} className="rounded-2xl border border-navy/10 bg-ivory-card p-6 transition-colors hover:border-gold-deep/60 sm:p-7">
                <p className="text-xs font-medium text-[#75623f]">{service.label} <span aria-hidden="true">↗</span></p>
                <h3 className="mt-3 text-lg font-semibold text-navy">{service.title}</h3>
                <p className="mt-3 leading-7">{service.text}</p>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-[#6f685b]">블로그 글은 로그인 없이 읽을 수 있어요. 1:1 상담은 유료이며, 신청 후 상담 범위와 금액을 확인하고 결제를 진행해 주세요.</p>
        </section>
        <section>
          <h2 className="mb-4 font-myeongjo text-2xl font-bold text-navy">“이 글, 내 사주에도 해당할까요?”</h2>
          <p>
            사주로아는 글을 읽고 남는 이 질문에서 시작했어요. 명리학을 설명하는 글과 내 사주에 따른
            맞춤 판정을 연결해, 글 속 이야기를 나에게 비추어 살펴볼 수 있는 공간을 만들었어요.
          </p>
          <p className="mt-3">
            연애와 관계, 일과 진로, 재물에 대한 태도, 가족과 일상까지.
            글을 읽으며 자신의 경험과 선택을 천천히 돌아보는 시간이 되었으면 해요.
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-navy">처음 오셨다면 이렇게 둘러보세요</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li><Link href="/" className="underline underline-offset-4">블로그</Link>에서 마음이 가는 글을 골라보세요. 로그인 없이 편하게 읽을 수 있어요.</li>
            <li>내 사주와 연결해서 보고 싶다면 로그인 후 생년월일, 양력·음력 구분과 출생 시간 등을 입력해 주세요.</li>
            <li>판정 조건이 등록된 글에서 내 사주가 그 조건에 해당하는지 확인해 보세요. 특정 사건이나 결과를 보장한다는 뜻은 아니에요.</li>
            <li>내 상황을 더 자세히 나누고 싶다면 <Link href="/counsel" className="underline underline-offset-4">비공개 상담 안내</Link>를 살펴보세요.</li>
          </ol>
        </section>
        <section className="border-l-2 border-gold-line pl-5 text-[#6f685b]">
          <h2 className="mb-3 text-lg font-semibold text-navy">함께 기억해 주세요</h2>
          <p>
            사주와 명리학은 전통적인 해석 체계예요. 생년월일이나 오행만으로 질병, 투자 수익,
            타인의 감정이나 미래의 사건을 확정할 수는 없어요. 글에 나오는 유형만으로 한 사람의 모든 모습을 설명할 수도 없고요.
          </p>
          <p className="mt-3">
            건강 문제는 의료진에게, 투자·법률 문제는 해당 분야 전문가에게 확인해 주세요.
            중요한 선택에서는 실제 상황과 확인할 수 있는 정보를 함께 살펴주세요.
          </p>
        </section>
        <section id="business-info" className="scroll-mt-24 rounded-2xl border border-navy/10 bg-ivory-card p-6 sm:p-8">
          <h2 className="mb-4 text-lg font-semibold text-navy">사주로아를 운영하는 곳</h2>
          <BusinessInfo />
          <p className="mt-3">월덕브랜드연구소는 사업자등록증에 기재된 상호이며, 사주로아는 이용자에게 서비스를 제공할 때 사용하는 브랜드명입니다. 콘텐츠와 상담은 로아가 담당합니다.</p>
          <div className="mt-5 border-t border-navy/10 pt-5">
          <p>
            이용하다 궁금한 점이나 글에서 잘못된 내용을 발견하셨나요?
            <Link href="/contact" className="ml-1 underline">문의 페이지</Link>에 안내된 연락처로 편하게 알려주세요.
            개인정보 처리와 서비스 이용 범위는 <Link href="/privacy" className="underline">개인정보처리방침</Link>과
            <Link href="/terms" className="ml-1 underline">이용약관</Link>에서 확인할 수 있습니다.
          </p>
          </div>
        </section>
      </div>
    </div>
  )
}
