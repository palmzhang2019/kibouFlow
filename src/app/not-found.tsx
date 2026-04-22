import Link from "next/link";

/**
 * Global 404 page — sits at the root layout level (outside [locale]),
 * so next-intl is not available. We render bilingual (zh + ja) content
 * to cover both audiences with minimal complexity.
 */
export default function NotFound() {
  return (
    <html lang="zh" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex h-16 items-center">
              <Link href="/zh" className="text-xl font-bold text-primary">
                kibouFlow
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-6xl font-bold text-gray-200">404</p>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">
              页面未找到 / ページが見つかりません
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              你访问的页面不存在，可能已被移动或删除。
            </p>
            <p className="mt-1 text-sm text-gray-500">
              お探しのページは存在しないか、移動・削除された可能性があります。
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/zh"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                返回首页 / トップへ
              </Link>
              <Link
                href="/zh/guides"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                浏览内容 / 記事一覧
              </Link>
            </div>

            <div className="mt-6 text-xs text-gray-400 space-x-3">
              <Link href="/ja" className="hover:text-gray-600 transition-colors">
                日本語トップ
              </Link>
              <span>·</span>
              <Link href="/ja/guides" className="hover:text-gray-600 transition-colors">
                日本語記事
              </Link>
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100">
          kibouFlow
        </footer>
      </body>
    </html>
  );
}
