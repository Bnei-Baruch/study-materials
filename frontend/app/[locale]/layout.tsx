import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Material Service",
  description: "Create and manage lesson parts with sources",
  icons: {
    icon: "/favicon.svg",
  },
};

const SUPPORTED_LOCALES = ['he', 'en', 'ru', 'es', 'de', 'it', 'fr', 'uk']

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
  }))
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  
  // Validate locale, default to 'he' if invalid
  const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'he'

  return (
    <>
      {children}
    </>
  )
}
