import { useLocaleStore } from '@/lib/store'
import { translations, type Locale } from '@/lib/i18n'

export function useLocale() {
  const { locale, setLocale } = useLocaleStore()
  const t = translations[locale]

  const toggleLocale = () => {
    setLocale(locale === 'th' ? 'en' : 'th')
  }

  return {
    locale,
    setLocale,
    toggleLocale,
    t,
  }
}

export function formatPrice(amount: number, locale: Locale = 'th'): string {
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string, locale: Locale = 'th'): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatNumber(num: number, locale: Locale = 'th'): string {
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US').format(num)
}

export function getRelativeTime(dateString: string, locale: Locale = 'th'): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale === 'th' ? 'th' : 'en', { numeric: 'auto' })

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
  } else {
    return formatDate(dateString, locale)
  }
}
