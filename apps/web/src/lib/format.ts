const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

export function formatPrice(price: string | number): string {
  return priceFormatter.format(Number(price));
}

export function formatKm(km: number): string {
  return `${numberFormatter.format(km)} km`;
}

const FUEL_TYPE_LABELS: Record<string, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  cng: 'CNG',
  lpg: 'LPG',
  other: 'Other',
};

export function formatFuelType(fuelType: string): string {
  return FUEL_TYPE_LABELS[fuelType] ?? fuelType;
}

export function formatTransmission(transmission: string): string {
  return transmission === 'automatic' ? 'Automatic' : 'Manual';
}
