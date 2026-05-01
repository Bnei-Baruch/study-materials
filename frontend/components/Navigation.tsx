'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Moon, Sun, LayoutGrid } from 'lucide-react'

const LANGUAGES = {
  he: 'עברית',
  en: 'English',
  ru: 'Русский',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  fr: 'Français',
  uk: 'Українська',
  tr: 'Türkçe',
  'pt-BR': 'Português',
  bg: 'Български',
}

const SITE_NAME = {
  he: 'בני ברוך',
  en: 'BNEI BARUCH',
  ru: 'БНЕЙ БАРУХ',
  es: 'BNEI BARUCH',
  de: 'BNEI BARUCH',
  it: 'BNEI BARUCH',
  fr: 'BNEI BARUCH',
  uk: 'БНЕЙ БАРУХ',
  tr: 'BNEI BARUCH',
  'pt-BR': 'BNEI BARUCH',
  bg: 'БНЕЙ БАРУХ',
}

const SITE_TAGLINE = {
  he: 'קבלה לעם',
  en: "KABBALAH L'AM",
  ru: "KABBALAH L'AM",
  es: "KABBALAH L'AM",
  de: "KABBALAH L'AM",
  it: "KABBALAH L'AM",
  fr: "KABBALAH L'AM",
  uk: "KABBALAH L'AM",
  tr: "KABBALAH L'AM",
  'pt-BR': "KABBALAH L'AM",
  bg: "KABBALAH L'AM",
}

const SITE_SUBTITLE = {
  he: 'קהילת לומדי קבלה',
  en: 'Kabbalah Community',
  ru: 'Каббала Сообщество',
  es: 'Comunidad Cabalá',
  de: 'Kabbala Gemeinschaft',
  it: 'Comunità Cabala',
  fr: 'Communauté Kabbale',
  uk: 'Каббала Спільнота',
  tr: 'Kabala Topluluğu',
  'pt-BR': 'Comunidade Cabalá',
  bg: 'Кабала Общност',
}

const USEFUL_LINKS: { labels: Record<string, string>; url: string }[] = [
  {
    labels: { he: 'לוח אירועים', en: 'Events Calendar', ru: 'Календарь событий', es: 'Calendario de eventos', de: 'Veranstaltungskalender', it: 'Calendario eventi', fr: 'Calendrier des événements', uk: 'Календар подій', tr: 'Etkinlik Takvimi', 'pt-BR': 'Calendário de eventos', bg: 'Календар на събитията' },
    url: 'https://events.kli.one',
  },
  {
    labels: { he: 'מערכת הערבות', en: 'Arvut System', ru: 'Система Арвут', es: 'Sistema Arvut', de: 'Arvut-System', it: 'Sistema Arvut', fr: 'Système Arvut', uk: 'Система Арвут', tr: 'Arvut Sistemi', 'pt-BR': 'Sistema Arvut', bg: 'Система Арвут' },
    url: 'https://arvut.kli.one',
  },
  {
    labels: { he: 'אתר הכנס', en: 'Convention Site', ru: 'Сайт конгресса', es: 'Sitio del congreso', de: 'Kongressseite', it: 'Sito del convegno', fr: 'Site du congrès', uk: 'Сайт конгресу', tr: 'Kongre Sitesi', 'pt-BR': 'Site do congresso', bg: 'Сайт на конгреса' },
    url: 'https://convention.kli.one',
  },
  {
    labels: { he: 'קבלה מדיה', en: 'Kabbalah Media', ru: 'Каббала Медиа', es: 'Kabbalah Media', de: 'Kabbala Media', it: 'Kabbalah Media', fr: 'Kabbalah Média', uk: 'Кабала Медіа', tr: 'Kabbalah Medya', 'pt-BR': 'Kabbalah Media', bg: 'Кабала Медия' },
    url: 'https://kabbalahmedia.info',
  },
  {
    labels: { he: 'תשלומי בב', en: 'BB Payments', ru: 'Платежи ББ', es: 'Pagos BB', de: 'BB-Zahlungen', it: 'Pagamenti BB', fr: 'Paiements BB', uk: 'Платежі ББ', tr: 'BB Ödemeleri', 'pt-BR': 'Pagamentos BB', bg: 'Плащания ББ' },
    url: 'https://pay.kli.one',
  },
  {
    labels: { he: 'הבית הווירטואלי', en: 'Virtual Home', ru: 'Виртуальный дом', es: 'Hogar virtual', de: 'Virtuelles Zuhause', it: 'Casa virtuale', fr: 'Maison virtuelle', uk: 'Віртуальний дім', tr: 'Sanal Ev', 'pt-BR': 'Casa virtual', bg: 'Виртуален дом' },
    url: 'https://kli.one',
  },
]

export default function Navigation() {
  const [language, setLanguage] = useState('he')
  const [dark, setDark] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [linksOpen, setLinksOpen] = useState(false)

  const isRTL = language === 'he'

  useEffect(() => {
    const saved = localStorage.getItem('public-language')
    if (saved && saved in LANGUAGES) {
      setLanguage(saved)
    }
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    localStorage.setItem('public-language', newLang)
    window.dispatchEvent(new Event('languageChange'))
  }

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    window.dispatchEvent(new Event('themeChange'))
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Site Name */}
          <a href="#" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/tree-logo.svg" width="54" height="72" alt="" />
            <div className="flex flex-col gap-0.5">
              <h1 className="text-blue-900 dark:text-blue-200 leading-none font-bold" style={{ fontSize: '17px' }}>
                {SITE_NAME[language as keyof typeof SITE_NAME]}
              </h1>
              <h1 className="text-blue-900 dark:text-blue-200 leading-none font-bold" style={{ fontSize: '17px' }}>
                {SITE_TAGLINE[language as keyof typeof SITE_TAGLINE]}
              </h1>
              <p className="text-blue-800 dark:text-blue-300 leading-none" style={{ fontSize: '11px' }}>
                {SITE_SUBTITLE[language as keyof typeof SITE_SUBTITLE]}
              </p>
            </div>
          </a>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Useful links */}
            <div className="relative">
              <button
                onClick={() => setLinksOpen(o => !o)}
                title="קישורים שימושיים"
                className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-white dark:bg-gray-800"
              >
                <LayoutGrid className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              {linksOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLinksOpen(false)} />
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-50`}>
                    {USEFUL_LINKS.map(link => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}
                        onClick={() => setLinksOpen(false)}
                      >
                        <div className="font-medium text-gray-800 dark:text-gray-200">{link.labels[language] ?? link.labels['he']}</div>
                        <div className="text-xs text-gray-400">{link.url.replace('https://', '')}</div>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-white dark:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {dark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 font-bold text-gray-800 dark:text-gray-200 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                style={{ fontSize: '14px' }}
              >
                {language.toUpperCase()}
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50`}>
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => { handleLanguageChange(code); setLangOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                      >
                        <span className="font-bold text-gray-800 dark:text-gray-200 w-8">{code.toUpperCase()}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm flex-1">{name}</span>
                        {code === language && <span className="text-gray-800 dark:text-gray-200">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
