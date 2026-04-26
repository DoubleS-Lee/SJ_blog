export function inferPageType(pathname: string) {
  if (pathname === '/') return 'blog_list'
  if (pathname.startsWith('/posts/')) return 'post_detail'
  if (pathname === '/counsel') return 'counsel'
  if (pathname.startsWith('/counsel/new')) return 'counsel_new'
  if (pathname.startsWith('/compatibility/')) return 'compatibility_period'
  if (pathname === '/compatibility') return 'compatibility'
  if (pathname === '/taekil') return 'taekil'
  if (pathname === '/life-graph') return 'life_graph'
  if (pathname === '/interpretation') return 'interpretation'
  if (pathname.startsWith('/mypage')) return 'mypage'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname === '/login') return 'login'
  if (pathname === '/agree') return 'agree'
  return 'other'
}

export function inferContentMeta(pathname: string) {
  if (pathname.startsWith('/posts/')) {
    return {
      contentType: 'blog_post',
      contentId: pathname.replace('/posts/', ''),
    }
  }

  if (pathname.startsWith('/compatibility/')) {
    return {
      contentType: 'compatibility_period',
      contentId: pathname.replace('/compatibility/', ''),
    }
  }

  return {
    contentType: null,
    contentId: null,
  }
}
