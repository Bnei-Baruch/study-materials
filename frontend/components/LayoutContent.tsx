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
    </>
  )
}
