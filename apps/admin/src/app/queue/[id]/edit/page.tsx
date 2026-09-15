'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  ApiError,
  addVehiclePhotosAsStaff,
  getAdminVehicle,
  getCategories,
  getLocations,
  removeVehiclePhoto,
  reorderVehiclePhotos,
  updateVehicle,
} from '@/lib/api';
import type {
  AdminVehicle,
  Category,
  Location,
  UpdateVehiclePayload,
  VehicleSpecs,
} from '@/types/vehicle';
import { buildTechSpecsPayload, getSpecFieldsForCategory, type SpecFieldKey } from '@/lib/spec-fields';

const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'cng', 'lpg', 'other'];
const TRANSMISSIONS = ['manual', 'automatic'];
const CONDITIONS = ['excellent', 'good', 'fair'];
const CONTACT_METHODS: Array<{ value: VehicleSpecs['preferredContact']; label: string }> = [
  { value: undefined, label: 'No preference' },
  { value: 'call', label: 'Call' },
  { value: 'chat', label: 'Chat' },
  { value: 'both', label: 'Both' },
];
const MAX_PHOTOS = 10;

export default function EditVehiclePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();

  const [vehicle, setVehicle] = useState<AdminVehicle | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [vehicleResult, categoryResult, locationResult] = await Promise.all([
        getAdminVehicle(accessToken, params.id),
        getCategories(),
        getLocations(),
      ]);
      setVehicle(vehicleResult);
      setCategories(categoryResult);
      setLocations(locationResult);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load this listing.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, params.id]);

  const reloadVehicle = useCallback(async () => {
    if (!accessToken) return;
    setVehicle(await getAdminVehicle(accessToken, params.id));
  }, [accessToken, params.id]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (isAuthLoading || !user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Edit Listing</h1>
        <Link href="/queue" className="text-sm text-muted transition hover:text-foreground">
          &larr; Back to Vehicle Queue
        </Link>
      </div>

      {loadError && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{loadError}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : vehicle ? (
        <>
          <EditForm
            vehicle={vehicle}
            categories={categories}
            locations={locations}
            accessToken={accessToken as string}
            onSaved={setVehicle}
          />
          <PhotoManager
            vehicle={vehicle}
            accessToken={accessToken as string}
            onChanged={reloadVehicle}
          />
        </>
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

const inputClass =
  'w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none';

function EditForm({
  vehicle,
  categories,
  locations,
  accessToken,
  onSaved,
}: {
  vehicle: AdminVehicle;
  categories: Category[];
  locations: Location[];
  accessToken: string;
  onSaved: (vehicle: AdminVehicle) => void;
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
    vehicle.specs?.registrationNumber ?? '',
  );
  const [rcAvailable, setRcAvailable] = useState(vehicle.specs?.rcAvailable ?? false);
  const [insuranceValidUntil, setInsuranceValidUntil] = useState(
    vehicle.specs?.insuranceValidUntil ? vehicle.specs.insuranceValidUntil.slice(0, 10) : '',
  );
  const [noChallan, setNoChallan] = useState(vehicle.specs?.noChallan ?? false);
  const [nonAccident, setNonAccident] = useState(vehicle.specs?.nonAccident ?? false);
  const [ownerCount, setOwnerCount] = useState(
    vehicle.specs?.ownerCount ? String(vehicle.specs.ownerCount) : '',
  );
  const [areaText, setAreaText] = useState(vehicle.specs?.areaText ?? '');
  const [preferredContact, setPreferredContact] = useState(vehicle.specs?.preferredContact ?? '');

  // See apps/web's edit-listing page for the same pattern/rationale — a
  // single string-keyed object since which fields apply depends on the
  // current categorySlug, seeded across every possible key so switching
  // category and back doesn't lose an already-entered value.
  const [techSpecs, setTechSpecs] = useState<Partial<Record<SpecFieldKey, string>>>(() => {
    const seeded: Partial<Record<SpecFieldKey, string>> = {};
    const keys: SpecFieldKey[] = [
      'seatingCapacity',
      'ptoHp',
      'liftingCapacityKg',
      'loadCapacityKg',
      'numberOfCylinders',
      'numberOfGears',
    ];
    for (const key of keys) {
      const value = vehicle.specs?.[key];
      if (value !== undefined && value !== null) seeded[key] = String(value);
    }
    return seeded;
  });

  function updateTechSpec(key: SpecFieldKey, value: string): void {
    setTechSpecs((prev) => ({ ...prev, [key]: value }));
  }

  const techSpecFields = getSpecFieldsForCategory(categorySlug);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload: UpdateVehiclePayload = {
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
        specs: {
          registrationNumber: registrationNumber || undefined,
          rcAvailable,
          insuranceValidUntil: insuranceValidUntil
            ? new Date(insuranceValidUntil).toISOString()
            : undefined,
          noChallan,
          nonAccident,
          ownerCount: ownerCount ? Number(ownerCount) : undefined,
          areaText: areaText || undefined,
          preferredContact: preferredContact
            ? (preferredContact as VehicleSpecs['preferredContact'])
            : undefined,
          ...buildTechSpecsPayload(categorySlug, techSpecs),
        },
      };
      const updated = await updateVehicle(accessToken, vehicle.id, payload);
      onSaved(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes.');
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
            onChange={(e) => setFuelType(e.target.value)}
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
            onChange={(e) => setTransmission(e.target.value)}
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
            onChange={(e) => setCondition(e.target.value)}
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
          <Field label="Preferred Contact Method">
            <select
              className={inputClass}
              value={preferredContact ?? ''}
              onChange={(e) => setPreferredContact(e.target.value)}
            >
              {CONTACT_METHODS.map((c) => (
                <option key={c.label} value={c.value ?? ''}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="accent-primary"
              checked={rcAvailable}
              onChange={(e) => setRcAvailable(e.target.checked)}
            />
            RC Available
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="accent-primary"
              checked={noChallan}
              onChange={(e) => setNoChallan(e.target.checked)}
            />
            No Pending Challan
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="accent-primary"
              checked={nonAccident}
              onChange={(e) => setNonAccident(e.target.checked)}
            />
            Non-accident
          </label>
        </div>
      </div>

      {techSpecFields.length > 0 && (
        <div className="border-t border-line pt-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Technical Specifications</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {techSpecFields.map((field) => (
              <Field key={field.key} label={field.unit ? `${field.label} (${field.unit})` : field.label}>
                <input
                  type={field.inputType === 'number' ? 'number' : 'text'}
                  min={field.inputType === 'number' ? 0 : undefined}
                  className={inputClass}
                  value={techSpecs[field.key] ?? ''}
                  onChange={(e) => updateTechSpec(field.key, e.target.value)}
                  placeholder={field.inputType === 'text' ? 'e.g. 8F + 2R' : undefined}
                />
              </Field>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-foreground">{error}</p>}
      {savedAt && !error && <p className="text-sm text-primary">Saved.</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="press rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] disabled:opacity-60"
      >
        {isSaving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function PhotoManager({
  vehicle,
  accessToken,
  onChanged,
}: {
  vehicle: AdminVehicle;
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
      await addVehiclePhotosAsStaff(accessToken, vehicle.id, files);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload photos.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove(mediaId: string): Promise<void> {
    setBusyMediaId(mediaId);
    setError(null);
    try {
      await removeVehiclePhoto(accessToken, vehicle.id, mediaId);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove photo.');
    } finally {
      setBusyMediaId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1): Promise<void> {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const reordered = [...photos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    setBusyMediaId(photos[index].id);
    setError(null);
    try {
      await reorderVehiclePhotos(
        accessToken,
        vehicle.id,
        reordered.map((p) => p.id),
      );
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reorder photos.');
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
          {isUploading ? 'Uploading…' : '+ Add photos'}
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
        <p className="text-sm text-muted">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element -- storage host isn't configured for next/image */}
              <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-foreground/70 px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => void handleMove(index, -1)}
                  disabled={index === 0 || busyMediaId !== null}
                  className="press-icon rounded px-1.5 py-0.5 text-xs text-white disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => void handleMove(index, 1)}
                  disabled={index === photos.length - 1 || busyMediaId !== null}
                  className="press-icon rounded px-1.5 py-0.5 text-xs text-white disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemove(photo.id)}
                  disabled={busyMediaId !== null}
                  className="press-icon rounded px-1.5 py-0.5 text-xs text-white transition hover:text-red-300 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
