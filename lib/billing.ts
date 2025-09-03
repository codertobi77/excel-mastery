// Centralized billing configuration

export type Currency = 'USD' | 'EUR' | 'XOF'

// Canonical billing price: charge in USD 49.99
export const PRO_USD_PRICE = 49.99

// UI-only: pick a currency code to display according to nationality (no conversion applied)
export const DEFAULT_CURRENCY: Currency = 'USD'

export function getCurrencyForCountry(countryCode: string): Currency {
  const cc = (countryCode || '').toUpperCase()
  const AFRICA_XOF = new Set(['SN','CI','BF','BJ','ML','NE','TG','GW'])
  if (AFRICA_XOF.has(cc)) return 'XOF'
  const EUROPE = new Set(['FR','BE','DE','ES','IT','NL','PT','IE','FI','SE','NO','DK','PL','AT','CZ','HU','RO','BG','HR','SI','SK','EE','LV','LT','GR','LU','MT','CY'])
  if (EUROPE.has(cc)) return 'EUR'
  return 'USD'
}


