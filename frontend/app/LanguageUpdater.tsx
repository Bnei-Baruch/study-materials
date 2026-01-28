'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function LanguageUpdater() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const lang = localStorage.getItem('studymaterials-language') || 'he'
    document.documentElement.lang = lang
    
    // Check if we're on a locale path and need to switch languages
    const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/)
    const currentLocale = localeMatch ? localeMatch[1] : null
    
    if (currentLocale && currentLocale !== lang) {
      // Replace the locale in the path
      const newPath = pathname.replace(/^\/[a-z]{2}/, `/${lang}`)
      router.push(newPath || `/${lang}`)
    }
  }, [])

  // Listen for language changes from Navigation component
  useEffect(() => {
    const handleLanguageChange = () => {
      const lang = localStorage.getItem('studymaterials-language') || 'he'
      document.documentElement.lang = lang
      
      // Navigate to the new locale path if on a public page
      const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/)
      const currentLocale = localeMatch ? localeMatch[1] : null
      
      if (currentLocale && currentLocale !== lang) {
        const newPath = pathname.replace(/^\/[a-z]{2}/, `/${lang}`)
        router.push(newPath || `/${lang}`)
      }
    }

    window.addEventListener('storage', handleLanguageChange)
    window.addEventListener('languageChange', handleLanguageChange)
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange)
      window.removeEventListener('languageChange', handleLanguageChange)
    }
  }, [pathname, router])

  return null
}
