'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/Navigation'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  return (
    <>
      {!isAdmin && <Navigation />}
      {children}
      {!isAdmin && (
        <footer className="py-6 text-center bg-cyan-50 dark:bg-gray-950 transition-colors text-sm text-gray-500 dark:text-gray-400">
          <a href="mailto:study-materials@kab.co.il" className="hover:text-blue-600 dark:hover:text-blue-400 underline-offset-2 hover:underline">
            study-materials@kab.co.il
          </a>
        </footer>
      )}
    </>
  )
}
