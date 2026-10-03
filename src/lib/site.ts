// Public destinations shared by pages and generated metadata.
export const EARLY_ACCESS_URL = 'https://tally.so/r/xXOKQr'
export const SITE_URL = process.env.SITE_URL || 'https://promptsuno.com'

const site = new URL(SITE_URL)
if (site.protocol !== 'https:' || site.username || site.password) {
  throw new Error('SITE_URL must be an HTTPS URL without credentials')
}

export function siteUrl(pathname: string) {
  return new URL(pathname, site).toString()
}
