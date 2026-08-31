'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getMyVehicles,
  updateMyVehicle,
  removeMyVehicleMedia,
  uploadVehicleMedia,
  getCategories,
  getLocations,
  ApiError,
} from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { MediaImage } from '@/components/media-image';
import { ImageOff } from 'lucide-react';
import type {
  Category,
  Location,
  MyVehicle,
  UpdateMyVehiclePayload,
  MyVehicleSpecs,
} from '@/types/vehicle';

const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'cng', 'lpg', 'other'];
const TRANSMISSIONS = ['manual', 'automatic'];
const CONDITIONS = ['excellent', 'good', 'fair'];
const MAX_PHOTOS = 10;
const inputClass =
  'w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none';

// Mirrors the API's SELLER_EDITABLE_STATUSES exactly — a listing outside
// this list can only be changed by staff (see AdminVehiclesController).
const EDITABLE_STATUSES = ['draft', 'submitted', 'under_review'];

export default function EditMyListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useCustomerAuth();

  const [vehicle, setVehicle] = useState<MyVehicle | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // There's no single-vehicle "my listing" fetch endpoint yet — with a
  // realistic number of listings per seller, fetching the whole list and
  // finding this one is simpler than adding a new endpoint for it. Revisit
  // if sellers routinely end up with many dozens of listings.
  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [vehicles, categoryResult, locationResult] = await Promise.all([
        getMyVehicles(accessToken),
        getCategories(),
        getLocations(),
      ]);
      const found = vehicles.find((v) => v.id === params.id);
      if (!found) {
        setLoadError('Ye listing nahi mili.');
      } else {
        setVehicle(found);
      }
      setCategories(categoryResult);
      setLocations(locationResult);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Listing load nahi ho paayi.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, params.id]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace(`/login?next=/my-listings/${params.id}/edit`);
    }
  }, [isAuthLoading, user, router, params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (isAuthLoading || !user) return null;

  const canEdit = vehicle && EDITABLE_STATUSES.includes(vehicle.status);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Edit Listing</h1>
        <Link href="/my-listings" className="text-sm text-muted transition hover:text-foreground">
          &larr; My Listings
        </Link>
      </div>

      {loadError && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{loadError}</p>
      )}

      {isLoading ? (
        <div className="space-y-5 rounded-2xl bg-background p-5 shadow-card">
          <div className="skeleton skeleton-title w-1/3" />
          <div className="skeleton skeleton-thumb w-full" />
          <div className="space-y-3">
            <div className="skeleton-row">
              <div className="skeleton skeleton-text w-full" />
            </div>
            <div className="skeleton-row">
              <div className="skeleton skeleton-text w-2/3" />
            </div>
            <div className="skeleton-row">
              <div className="skeleton skeleton-text w-1/2" />
            </div>
          </div>
        </div>
      ) : vehicle && canEdit ? (
        <>
          <EditForm
            vehicle={vehicle}
            categories={categories}
            locations={locations}
            accessToken={accessToken as string}
            onSaved={setVehicle}
          />
          <PhotoManager vehicle={vehicle} accessToken={accessToken as string} onChanged={load} />
        </>
      ) : vehicle ? (
        <p className="rounded-2xl bg-primary-light px-4 py-6 text-sm text-foreground shadow-card">
          Ye listing ab edit nahi ho sakti (status: {vehicle.status}). Badlaav ke liye support se
          sampark karein.
        </p>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function EditForm({
  vehicle,
  categories,
  locations,
  accessToken,
  onSaved,
}: {
  vehicle: MyVehicle;
  categories: Category[];
  locations: Location[];
  accessToken: string;
  onSaved: (vehicle: MyVehicle) => void;
}) {
  const [title, setTitle] = useState(vehicle.title);
  const [brand, setBrand] = useState(vehicle.brand);
  const [model, setModel] = useState(vehicle.model);
  const [year, setYear] = useState(String(vehicle.year));
  const [price, setPrice] = useState(vehicle.price);
  const [kmDriven, setKmDriven] = useState(String(vehicle.kmDriven));
  const [fuelType, setFuelType] = useState(vehicle.fuelType);
  const [transmission, setTransmission] = useState(vehicle.transmission);
  const [condition, setCondition] = useState(vehicle.condition ?? 'good');
  const [categorySlug, setCategorySlug] = useState(vehicle.category.slug);
  const [locationSlug, setLocationSlug] = useState(vehicle.location.slug);
  const [description, setDescription] = useState(vehicle.description ?? '');

  const [registrationNumber, setRegistrationNumber] = useState(
    vehicle.specs.registrationNumber ?? '',
  );
  const [rcAvailable, setRcAvailable] = useState(vehicle.specs.rcAvailable ?? false);
  const [insuranceValidUntil, setInsuranceValidUntil] = useState(
    vehicle.specs.insuranceValidUntil ? vehicle.specs.insuranceValidUntil.slice(0, 10) : '',
  );
  const [noChallan, setNoChallan] = useState(vehicle.specs.noChallan ?? false);
  const [nonAccident, setNonAccident] = useState(vehicle.specs.nonAccident ?? false);
  const [ownerCount, setOwnerCount] = useState(
    vehicle.specs.ownerCount ? String(vehicle.specs.ownerCount) : '',
  );
  const [areaText, setAreaText] = useState(vehicle.specs.areaText ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const specs: MyVehicleSpecs = {
        registrationNumber: registrationNumber || undefined,
        rcAvailable,
        insuranceValidUntil: insuranceValidUntil
          ? new Date(insuranceValidUntil).toISOString()
          : undefined,
        noChallan,
        nonAccident,
        ownerCount: ownerCount ? Number(ownerCount) : undefined,
        areaText: areaText || undefined,
      };
      const payload: UpdateMyVehiclePayload = {
        categorySlug,
        locationSlug,
        title,
        brand,
        model,
        year: Number(year),
        price: Number(price),
        kmDriven: Number(kmDriven),
        fuelType,
        transmission,
        condition,
        description: description || undefined,
        specs,
      };
      const updated = await updateMyVehicle(accessToken, vehicle.id, payload);
      onSaved(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save nahi ho paaya.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-background p-5 shadow-card">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Category">
          <select
            className={inputClass}
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Brand">
          <input className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)} />
        </Field>
        <Field label="Model">
          <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} />
        </Field>
        <Field label="Year">
          <input
            type="number"
            className={inputClass}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </Field>
        <Field label="Price (₹)">
          <input
            type="number"
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <Field label="KM Driven">
          <input
            type="number"
            className={inputClass}
            value={kmDriven}
            onChange={(e) => setKmDriven(e.target.value)}
          />
        </Field>
        <Field label="Location">
          <select
            className={inputClass}
            value={locationSlug}
            onChange={(e) => setLocationSlug(e.target.value)}
          >
            {locations.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.district}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fuel Type">
          <select
            className={inputClass}
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value as MyVehicle['fuelType'])}
          >
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f[0].toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Transmission">
          <select
            className={inputClass}
            value={transmission}
            onChange={(e) => setTransmission(e.target.value as MyVehicle['transmission'])}
          >
            {TRANSMISSIONS.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Condition">
          <select
            className={inputClass}
            value={condition}
            onChange={(e) => setCondition(e.target.value as MyVehicle['condition'])}
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <textarea
          rows={3}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="border-t border-line pt-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Trust &amp; verification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Registration Number">
            <input
              className={inputClass}
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
          </Field>
          <Field label="Owner Count">
            <input
              type="number"
              min={1}
              className={inputClass}
              value={ownerCount}
              onChange={(e) => setOwnerCount(e.target.value)}
            />
          </Field>
          <Field label="Insurance Valid Until">
            <input
              type="date"
              className={inputClass}
              value={insuranceValidUntil}
              onChange={(e) => setInsuranceValidUntil(e.target.value)}
            />
          </Field>
          <Field label="Area / Locality">
            <input
              className={inputClass}
              value={areaText}
              onChange={(e) => setAreaText(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={rcAvailable}
              onChange={(e) => setRcAvailable(e.target.checked)}
            />
            RC Available
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={noChallan}
              onChange={(e) => setNoChallan(e.target.checked)}
            />
            No Pending Challan
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={nonAccident}
              onChange={(e) => setNonAccident(e.target.checked)}
            />
            Non-accident
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-foreground">{error}</p>}
      {savedAt && !error && <p className="text-sm text-primary">Save ho gaya.</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="press rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark disabled:opacity-60"
      >
        {isSaving ? 'Save ho raha hai…' : 'Save Changes'}
      </button>
    </form>
  );
}

function PhotoManager({
  vehicle,
  accessToken,
  onChanged,
}: {
  vehicle: MyVehicle;
  accessToken: string;
  onChanged: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [busyMediaId, setBusyMediaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const photos = [...vehicle.media].sort((a, b) => a.sortOrder - b.sortOrder);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = '';
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      await uploadVehicleMedia(vehicle.id, files);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Photo upload nahi ho paaya.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove(mediaId: string): Promise<void> {
    setBusyMediaId(mediaId);
    setError(null);
    try {
      await removeMyVehicleMedia(accessToken, vehicle.id, mediaId);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Photo remove nahi ho paaya.');
    } finally {
      setBusyMediaId(null);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl bg-background p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Photos ({photos.length}/{MAX_PHOTOS})
        </h2>
        <label
          className={`press cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary-light ${
            isUploading || photos.length >= MAX_PHOTOS ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {isUploading ? 'Upload ho raha hai…' : '+ Photo Add Karein'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={isUploading || photos.length >= MAX_PHOTOS}
            onChange={(e) => void handleUpload(e)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-foreground">{error}</p>}

      {photos.length === 0 ? (
        <p className="text-sm text-muted">Abhi koi photo nahi hai.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative overflow-hidden rounded-xl shadow-card">
              <MediaImage
                src={photo.url}
                alt=""
                shape="thumb"
                emptyIcon={ImageOff}
                className="aspect-square w-full"
              />
              <button
                type="button"
                onClick={() => void handleRemove(photo.id)}
                disabled={busyMediaId !== null}
                className="press-icon absolute inset-x-0 bottom-0 bg-foreground/70 py-1 text-xs text-white transition hover:text-red-300 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
