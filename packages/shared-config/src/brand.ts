/**
 * Single source of truth for brand identity.
 *
 * The brand name is not finalized yet. Every app (customer web, admin web,
 * and later the mobile app) must read the brand name from here — never
 * hardcode it in a component, page title, or template. Renaming the
 * platform later means changing only this file.
 */
export const brand = {
  /** TEMPORARY placeholder name — not final. */
  name: 'CG Auto Mart',
  shortName: 'CGAM',
  tagline: 'Buy and sell vehicles in Chhattisgarh, the trusted way',
  supportPhone: '+91XXXXXXXXXX',
  colors: {
    primary: '#168A45',
    dark: '#171717',
    background: '#FFFFFF',
    lightGreen: '#F2F8F4',
    secondaryText: '#6B7280',
    border: '#E5E7EB',
  },
} as const;

export type Brand = typeof brand;
