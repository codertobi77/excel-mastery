export function formatPrice(amount: number, currency: string, locale?: string) {
  try {
    return new Intl.NumberFormat(locale || guessLocaleFromCurrency(currency), {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      maximumFractionDigits: currency === 'XOF' ? 0 : 2,
      minimumFractionDigits: currency === 'XOF' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(currency === 'XOF' ? 0 : 2)} ${currency}`
  }
}

export function guessLocaleFromCurrency(currency: string) {
  switch (currency) {
    case 'EUR':
      return 'fr-FR'
    case 'XOF':
      return 'fr-SN'
    case 'USD':
    default:
      return 'en-US'
  }
}


