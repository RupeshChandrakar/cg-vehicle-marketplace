'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Location, FuelType, Transmission } from '@/types/vehicle';
import { createVehicle, uploadVehicleMedia, ApiError } from '@/lib/api';

const FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'electric', 'cng', 'lpg', 'other'];
const TRANSMISSIONS: Transmission[] = ['manual', 'automatic'];
const MAX_PHOTOS = 10;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

type SubmitState =
  { status: 'idle' | 'submitting' | 'success' } | { status: 'error'; message: string };

export function SellVehicleForm({
  categories,
  locations,
}: {
  categories: Category[];
  locations: Location[];
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<File[]>([]);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!INDIAN_MOBILE_PATTERN.test(phoneDigits)) {
      setState({ status: 'error', message: 'Enter a valid 10-digit mobile number.' });
      return;
    }

    const form = new FormData(event.currentTarget);
    setState({ status: 'submitting' });

    try {
      const vehicle = await createVehicle({
        categorySlug: String(form.get('categorySlug')),
        locationSlug: String(form.get('locationSlug')),
        title: String(form.get('title')),
        brand: String(form.get('brand')),
        model: String(form.get('model')),
        year: Number(form.get('year')),
        price: Number(form.get('price')),
        kmDriven: Number(form.get('kmDriven')),
        fuelType: form.get('fuelType') as FuelType,
        transmission: form.get('transmission') as Transmission,
        description: String(form.get('description') || '') || undefined,
        sellerName: String(form.get('sellerName')),
        sellerPhone: `+91${phoneDigits}`,
      });

      if (photos.length > 0) {
        await uploadVehicleMedia(vehicle.id, photos);
      }

      setState({ status: 'success' });
      setTimeout(() => router.push('/'), 2500);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
      setState({ status: 'error', message });
    }
  }

  function handlePhotosChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const selected = Array.from(event.target.files ?? []).slice(0, MAX_PHOTOS);
    setPhotos(selected);
  }

  if (state.status === 'success') {
    return (
      <div className="border border-line px-6 py-12 text-center">
        <p className="text-lg font-medium text-foreground">Thanks — your listing is submitted!</p>
        <p className="mt-2 text-sm text-muted">
          Our team will review it shortly. You&apos;ll be contacted on the number you provided once
          it&apos;s approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <Section title="Vehicle details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select name="categorySlug" required defaultValue="">
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Listing title">
            <TextInput name="title" placeholder="e.g. Mahindra Bolero B4" required minLength={3} />
          </Field>

          <Field label="Brand">
            <TextInput name="brand" placeholder="e.g. Mahindra" required />
          </Field>

          <Field label="Model">
            <TextInput name="model" placeholder="e.g. Bolero B4" required />
          </Field>

          <Field label="Year">
            <TextInput
              name="year"
              type="number"
              min={1980}
              max={new Date().getFullYear() + 1}
              required
            />
          </Field>

          <Field label="Price (₹)">
            <TextInput name="price" type="number" min={0} required />
          </Field>

          <Field label="KM driven">
            <TextInput name="kmDriven" type="number" min={0} required />
          </Field>

          <Field label="Fuel type">
            <Select name="fuelType" required defaultValue="">
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

          <Field label="Transmission">
            <Select name="transmission" required defaultValue="">
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
        </div>

        <Field label="Description (optional)">
          <textarea
            name="description"
            rows={4}
            className="w-full border border-line px-3 py-2 text-sm text-foreground"
            placeholder="Anything a buyer should know — service history, condition, accessories…"
          />
        </Field>
      </Section>

      <Section title="Photos">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotosChange}
          className="text-sm text-foreground"
        />
        <p className="mt-1 text-xs text-muted">
          Up to {MAX_PHOTOS} photos (JPEG, PNG, or WebP).{' '}
          {photos.length > 0 && `${photos.length} selected.`}
        </p>
      </Section>

      <Section title="Location">
        <Field label="District">
          <Select name="locationSlug" required defaultValue="">
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
      </Section>

      <Section title="Seller information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <TextInput name="sellerName" required />
          </Field>
          <Field label="Mobile number">
            <div className="flex items-center border border-line">
              <span className="px-3 text-sm text-muted">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                required
                value={phoneDigits}
                onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full border-l border-line px-3 py-2 text-sm text-foreground"
                placeholder="98765 43210"
              />
            </div>
          </Field>
        </div>
      </Section>

      {state.status === 'error' && (
        <p className="border border-line bg-primary-light px-4 py-3 text-sm text-foreground">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={state.status === 'submitting'}
        className="w-full bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-60 sm:w-auto"
      >
        {state.status === 'submitting' ? 'Submitting…' : 'Submit for review'}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type={props.type ?? 'text'}
      className="w-full border border-line px-3 py-2 text-sm text-foreground"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className="w-full border border-line px-3 py-2 text-sm text-foreground" />
  );
}
