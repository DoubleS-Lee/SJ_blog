import NaverPostImportForm from './NaverPostImportForm'

export const metadata = { title: '네이버 글 가져오기' }

export default function AdminPostImportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <NaverPostImportForm />
    </div>
  )
}
