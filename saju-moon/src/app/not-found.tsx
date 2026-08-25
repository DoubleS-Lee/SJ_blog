import Link from 'next/link'

export const metadata = {
  title: '페이지를 찾을 수 없습니다',
  description: '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
}

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p
        className="mb-4 tracking-[6px]"
        style={{
          fontFamily: 'var(--font-cormorant-garamond), serif',
          fontSize: 14,
          fontWeight: 600,
          color: '#B78D3C',
        }}
      >
        404
      </p>

      <h1 className="mb-3 text-2xl font-bold tracking-tight">페이지를 찾을 수 없습니다</h1>

      <p className="mb-10 text-sm leading-7 text-gray-500">
        요청하신 글이 삭제되었거나 주소가 변경되었을 수 있습니다.
        <br />
        방금 전까지 보이던 글이라면 잠시 후 다시 시도해 주세요.
      </p>

      <Link
        href="/"
        className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
      >
        글 목록으로 가기
      </Link>
    </div>
  )
}
