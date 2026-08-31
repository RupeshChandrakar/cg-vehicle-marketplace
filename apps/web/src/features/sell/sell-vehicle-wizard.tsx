'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation, X } from 'lucide-react';
import type { Category, Location, FuelType, Transmission } from '@/types/vehicle';
import { createVehicle, uploadVehicleMedia, detectLocation, ApiError } from '@/lib/api';
import {
  getCategoryIcon,
  getCategoryIconColor,
  getCategoryTint,
} from '@/features/vehicles/category-icons';

const FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'electric', 'cng', 'lpg', 'other'];
const TRANSMISSIONS: Transmission[] = ['manual', 'automatic'];
const MAX_PHOTOS = 10;
const TOTAL_STEPS = 6;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

const STEP_TITLES = [
  'Vehicle type',
  'Vehicle Details',
  'Add Photos',
  'Location',
  'Seller Details',
  'Review & Submit',
];

interface WizardData {
  categorySlug: string;
  brand: string;
  model: string;
  year: string;
  price: string;
  fuelType: FuelType | '';
  transmission: Transmission | '';
  kmDriven: string;
  registrationNumber: string;
  locationSlug: string;
  areaText: string;
  sellerName: string;
  phoneDigits: string;
  preferredContact: 'call' | 'chat' | 'both';
  message: string;
}

const INITIAL_DATA: WizardData = {
  categorySlug: '',
  brand: '',
  model: '',
  year: '',
  price: '',
  fuelType: '',
  transmission: '',
  kmDriven: '',
  registrationNumber: '',
  locationSlug: '',
  areaText: '',
  sellerName: '',
  phoneDigits: '',
  preferredContact: 'both',
  message: '',
};

type SubmitState = { status: 'idle' | 'submitting' } | { status: 'error'; message: string };

type StepErrors = Partial<Record<keyof WizardData, string>>;

/** Mirrors canContinue()'s per-step gate, but with a message per missing/
 *  invalid field instead of one pass/fail boolean — shown only once the
 *  user actually tries to continue past an incomplete step (see
 *  showErrors below), not proactively while they're still filling it in. */
function getStepErrors(step: number, data: WizardData): StepErrors {
  const errors: StepErrors = {};
  switch (step) {
    case 2:
      if (!data.brand) errors.brand = 'Brand zaroori hai.';
      if (!data.model) errors.model = 'Model zaroori hai.';
      if (!data.year) errors.year = 'Year zaroori hai.';
      if (!data.price) errors.price = 'Price zaroori hai.';
      if (!data.fuelType) errors.fuelType = 'Fuel type select karein.';
      if (!data.transmission) errors.transmission = 'Transmission select karein.';
      if (!data.kmDriven) errors.kmDriven = 'KM driven zaroori hai.';
      break;
    case 4:
      if (!data.locationSlug) errors.locationSlug = 'District select karein.';
      break;
    case 5:
      if (!data.sellerName) errors.sellerName = 'Naam zaroori hai.';
      if (!INDIAN_MOBILE_PATTERN.test(data.phoneDigits)) {
        errors.phoneDigits = 'Valid 10-digit mobile number daalein.';
      }
      break;
  }
  return errors;
}

export function SellVehicleWizard({
  categories,
  locations,
}: {
  categories: Category[];
  locations: Location[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]): void {
    setData((prev) => ({ ...prev, [key]: value }));
    setShowErrors(false);
  }

  const stepErrors = showErrors ? getStepErrors(step, data) : {};

  function canContinue(): boolean {
    switch (step) {
      case 1:
        return data.categorySlug !== '';
      case 2:
        return Boolean(
          data.brand &&
          data.model &&
          data.year &&
          data.price &&
          data.fuelType &&
          data.transmission &&
          data.kmDriven,
        );
      case 3:
        return true; // photos are optional
      case 4:
        return data.locationSlug !== '';
      case 5:
        return Boolean(data.sellerName) && INDIAN_MOBILE_PATTERN.test(data.phoneDigits);
      default:
        return true;
    }
  }

  async function handleSubmit(): Promise<void> {
    setSubmitState({ status: 'submitting' });
    try {
      const vehicle = await createVehicle({
        categorySlug: data.categorySlug,
        locationSlug: data.locationSlug,
        title: `${data.brand} ${data.model}`.trim(),
        brand: data.brand,
        model: data.model,
        year: Number(data.year),
        price: Number(data.price),
        kmDriven: Number(data.kmDriven),
        fuelType: data.fuelType as FuelType,
        transmission: data.transmission as Transmission,
        description: data.message || undefined,
        specs: {
          registrationNumber: data.registrationNumber || undefined,
          areaText: data.areaText || undefined,
          preferredContact: data.preferredContact,
        },
        sellerName: data.sellerName,
        sellerPhone: `+91${data.phoneDigits}`,
      });

      if (photos.length > 0) {
        await uploadVehicleMedia(vehicle.id, photos);
      }

      setSubmitted(true);
      setTimeout(() => router.push('/'), 2500);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Kuch gadbad ho gayi. Dobara try karein.';
      setSubmitState({ status: 'error', message });
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-background px-6 py-12 text-center shadow-card">
        <p className="text-lg font-semibold text-foreground">
          Dhanyavaad — aapki listing submit ho gayi!
        </p>
        <p className="mt-2 text-sm text-muted">
          Hamari team jald hi review karegi. Approve hone par hum aapke diye gaye number par contact
          karenge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressHeader step={step} />

      <div className="rounded-2xl bg-background p-6 shadow-card sm:p-8">
        {step === 1 && (
          <StepVehicleType
            categories={categories}
            value={data.categorySlug}
            onChange={(slug) => update('categorySlug', slug)}
          />
        )}
        {step === 2 && <StepVehicleDetails data={data} update={update} errors={stepErrors} />}
        {step === 3 && <StepPhotos photos={photos} setPhotos={setPhotos} />}
        {step === 4 && (
          <StepLocation locations={locations} data={data} update={update} errors={stepErrors} />
        )}
        {step === 5 && <StepSellerDetails data={data} update={update} errors={stepErrors} />}
        {step === 6 && (
          <StepReview
            data={data}
            categories={categories}
            locations={locations}
            photoCount={photos.length}
          />
        )}
      </div>

      {submitState.status === 'error' && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">
          {submitState.message}
        </p>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => {
              setShowErrors(false);
              setStep((s) => s - 1);
            }}
            className="press rounded-lg border border-line px-4 py-3 text-sm font-medium text-foreground transition hover:bg-primary-light"
          >
            Back
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={() => {
              if (canContinue()) {
                setShowErrors(false);
                setStep((s) => s + 1);
              } else {
                setShowErrors(true);
              }
            }}
            className="press flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark hover:shadow-btn-hover-primary"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={submitState.status === 'submitting'}
            onClick={handleSubmit}
            className="press flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark hover:shadow-btn-hover-primary disabled:opacity-60 disabled:shadow-none"
          >
            {submitState.status === 'submitting' ? 'Submitting…' : 'Submit Listing'}
          </button>
        )}
      </div>
    </div>
  );
}

function ProgressHeader({ step }: { step: number }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted">
        Step {step} of {TOTAL_STEPS}
      </p>
      <h2 className="text-lg font-semibold text-foreground">{STEP_TITLES[step - 1]}</h2>
      <div className="h-1.5 w-full rounded-full bg-line">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StepVehicleType({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-muted">Sabse pehle vehicle type select karein</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.slug);
          const tint = getCategoryTint(category.slug);
          const iconColor = getCategoryIconColor(category.slug);
          const active = value === category.slug;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.slug)}
              className={`press-chip flex flex-col items-center gap-2 rounded-xl p-3 transition ${
                active ? 'bg-primary text-white shadow-btn' : `${tint} text-foreground hover:shadow-card`
              }`}
            >
              <Icon className={`h-6 w-6 ${active ? 'text-white' : iconColor}`} strokeWidth={1.75} />
              <span className="text-xs font-medium">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepVehicleDetails({
  data,
  update,
  errors,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  errors: StepErrors;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Brand *" error={errors.brand}>
        <TextInput
          value={data.brand}
          onChange={(v) => update('brand', v)}
          placeholder="e.g. Mahindra"
        />
      </Field>
      <Field label="Model *" error={errors.model}>
        <TextInput
          value={data.model}
          onChange={(v) => update('model', v)}
          placeholder="e.g. Bolero B4"
        />
      </Field>
      <Field label="Year *" error={errors.year}>
        <TextInput
          type="number"
          value={data.year}
          onChange={(v) => update('year', v)}
          min={1980}
          max={new Date().getFullYear() + 1}
        />
      </Field>
      <Field label="Expected Price (₹) *" error={errors.price}>
        <TextInput type="number" value={data.price} onChange={(v) => update('price', v)} min={0} />
      </Field>
      <Field label="Fuel Type *" error={errors.fuelType}>
        <Select value={data.fuelType} onChange={(v) => update('fuelType', v as FuelType)}>
          <option value="" disabled>
            Select fuel type
          </option>
          {FUEL_TYPES.map((fuel) => (
            <option key={fuel} value={fuel}>
              {fuel[0].toUpperCase() + fuel.slice(1)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Transmission *" error={errors.transmission}>
        <Select
          value={data.transmission}
          onChange={(v) => update('transmission', v as Transmission)}
        >
          <option value="" disabled>
            Select transmission
          </option>
          {TRANSMISSIONS.map((transmission) => (
            <option key={transmission} value={transmission}>
              {transmission[0].toUpperCase() + transmission.slice(1)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="KM Driven *" error={errors.kmDriven}>
        <TextInput
          type="number"
          value={data.kmDriven}
          onChange={(v) => update('kmDriven', v)}
          min={0}
        />
      </Field>
      <Field label="Registration Number">
        <TextInput
          value={data.registrationNumber}
          onChange={(v) => update('registrationNumber', v.toUpperCase())}
          placeholder="e.g. CG 08 AB 1234"
        />
      </Field>
    </div>
  );
}

function StepPhotos({
  photos,
  setPhotos,
}: {
  photos: File[];
  setPhotos: (photos: File[]) => void;
}) {
  function handleAdd(event: React.ChangeEvent<HTMLInputElement>): void {
    const selected = Array.from(event.target.files ?? []);
    setPhotos([...photos, ...selected].slice(0, MAX_PHOTOS));
    event.target.value = '';
  }

  function removeAt(index: number): void {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Kam se kam 6 photos add karein — gaadi ke alag-alag angle se
      </p>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((file, index) => (
          <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-xl shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element -- transient local file preview, never persisted */}
            <img
              src={URL.createObjectURL(file)}
              alt={`Photo ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label="Remove photo"
              className="press absolute top-1.5 right-1.5 rounded-full bg-foreground/70 p-1.5"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="press flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-xs text-muted transition hover:border-primary hover:text-primary">
            + Add Photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleAdd}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted">
        ({photos.length}/{MAX_PHOTOS})
      </p>
    </div>
  );
}

function StepLocation({
  locations,
  data,
  update,
  errors,
}: {
  locations: Location[];
  data: WizardData;
  update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  errors: StepErrors;
}) {
  const [isDetecting, setIsDetecting] = useState(false);

  function useCurrentLocation(): void {
    if (!('geolocation' in navigator)) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        detectLocation(position.coords.latitude, position.coords.longitude)
          .then((result) => update('locationSlug', result.matched.slug))
          .catch(() => undefined)
          .finally(() => setIsDetecting(false));
      },
      () => setIsDetecting(false),
    );
  }

  return (
    <div className="space-y-4">
      <Field label="District *" error={errors.locationSlug}>
        <Select value={data.locationSlug} onChange={(v) => update('locationSlug', v)}>
          <option value="" disabled>
            Select district
          </option>
          {locations.map((location) => (
            <option key={location.id} value={location.slug}>
              {location.district}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Area / City / Village">
        <TextInput
          value={data.areaText}
          onChange={(v) => update('areaText', v)}
          placeholder="e.g. Rajnandgaon City"
        />
      </Field>
      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={isDetecting}
        className="press flex items-center gap-2 rounded-lg border border-line px-3.5 py-2.5 text-sm font-medium text-foreground transition hover:bg-primary-light disabled:opacity-60"
      >
        <Navigation className="h-4 w-4 text-primary" />
        {isDetecting ? 'Detecting…' : 'Use My Current Location'}
      </button>
    </div>
  );
}

function StepSellerDetails({
  data,
  update,
  errors,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  errors: StepErrors;
}) {
  return (
    <div className="space-y-4">
      <Field label="Aapka Naam *" error={errors.sellerName}>
        <TextInput value={data.sellerName} onChange={(v) => update('sellerName', v)} />
      </Field>
      <Field label="Mobile Number *" error={errors.phoneDigits}>
        <div className="flex items-center overflow-hidden rounded-lg border border-line focus-within:border-primary">
          <span className="px-3 text-sm text-muted">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            value={data.phoneDigits}
            onChange={(e) => update('phoneDigits', e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full border-l border-line px-3 py-2.5 text-sm text-foreground focus:outline-none"
            placeholder="98765 43210"
          />
        </div>
      </Field>
      <Field label="Preferred Contact *">
        <div className="flex gap-4 text-sm text-foreground">
          {(['call', 'chat', 'both'] as const).map((option) => (
            <label key={option} className="flex items-center gap-1.5">
              <input
                type="radio"
                name="preferredContact"
                checked={data.preferredContact === option}
                onChange={() => update('preferredContact', option)}
                className="accent-primary"
              />
              {option[0].toUpperCase() + option.slice(1)}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Any Message (Optional)">
        <textarea
          value={data.message}
          onChange={(e) => update('message', e.target.value)}
          rows={3}
          placeholder="Agar aapke liye koi specific baat hai to hume bataayein…"
          className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </Field>
    </div>
  );
}

function StepReview({
  data,
  categories,
  locations,
  photoCount,
}: {
  data: WizardData;
  categories: Category[];
  locations: Location[];
  photoCount: number;
}) {
  const category = categories.find((c) => c.slug === data.categorySlug);
  const location = locations.find((l) => l.slug === data.locationSlug);

  const rows: Array<[string, string]> = [
    ['Vehicle', `${data.brand} ${data.model} ${data.year}`.trim()],
    ['Category', category?.name ?? '—'],
    ['Expected Price', data.price ? `₹${Number(data.price).toLocaleString('en-IN')}` : '—'],
    ['Fuel · Transmission · KM', `${data.fuelType} · ${data.transmission} · ${data.kmDriven} km`],
    ['Photos', `${photoCount} added`],
    ['Location', `${location?.district ?? '—'}${data.areaText ? `, ${data.areaText}` : ''}`],
    ['Seller', `${data.sellerName} · +91${data.phoneDigits}`],
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Review Your Details</h3>
      <dl className="space-y-2.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-line pb-2.5 last:border-0 last:pb-0">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      {children}
      {error && <span className="block text-xs text-danger">{error}</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  ...props
}: { value: string; onChange: (value: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
>) {
  return (
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={props.type ?? 'text'}
      className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
    >
      {children}
    </select>
  );
}
