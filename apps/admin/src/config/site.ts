/** Where the customer-facing web app is deployed — used to build real,
 *  clickable links to a vehicle's public detail page from admin-side tools
 *  (e.g. the WhatsApp new-listings digest on the Vehicle Queue page). */
export const CUSTOMER_WEB_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_WEB_URL ?? 'http://localhost:3000';
