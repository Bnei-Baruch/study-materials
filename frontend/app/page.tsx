'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Check localStorage for language preference
    const savedLang = localStorage.getItem('studymaterials-language')

    if (savedLang) {
      router.replace(`/${savedLang}`)
    } else {
      // Fallback to browser language or default
      const browserLang = navigator.language.split('-')[0]
      const supportedLangs = ['he', 'en', 'ru', 'es', 'de', 'it', 'fr', 'uk']
      const lang = supportedLangs.includes(browserLang) ? browserLang : 'he'
      router.replace(`/${lang}`)
    }
  }, [router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  )
}
