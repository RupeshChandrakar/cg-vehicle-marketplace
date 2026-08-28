import { API_BASE_URL } from '@/config/api';
import type {
  Category,
  Location,
  LocationDetectionResult,
  PaginatedResult,
  Vehicle,
  FuelType,
  Transmission,
} from '@/types/vehicle';

export interface VehicleFilters {
  q?: string;
  categorySlug?: string;
  locationSlug?: string;
  page?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    // Listings change often enough, and this is early enough in the
    // project, that correctness beats shaving a request via caching here.
    cache: 'no-store',
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}

/** The API's validation errors carry a useful message; fall back if the body isn't JSON. */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'message' in body) {
      const { message } = body as { message: string | string[] };
      return Array.isArray(message) ? message.join(', ') : message;
    }
  } catch {
    // Body wasn't JSON — fall through to the generic message below.
  }
  return `Request failed with status ${response.status}`;
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>('/categories');
}

export function getLocations(): Promise<Location[]> {
  return request<Location[]>('/locations');
}

export function detectLocation(
  latitude: number,
  longitude: number,
): Promise<LocationDetectionResult> {
  return request<LocationDetectionResult>('/locations/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  });
}

export function getVehicles(filters: VehicleFilters): Promise<PaginatedResult<Vehicle>> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.categorySlug) params.set('categorySlug', filters.categorySlug);
  if (filters.locationSlug) params.set('locationSlug', filters.locationSlug);
  if (filters.page) params.set('page', String(filters.page));

  const query = params.toString();
  return request<PaginatedResult<Vehicle>>(`/vehicles${query ? `?${query}` : ''}`);
}

export async function getVehicleByPublicId(publicId: number): Promise<Vehicle | null> {
  try {
    return await request<Vehicle>(`/vehicles/${publicId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export interface CreateVehicleSpecsPayload {
  registrationNumber?: string;
  areaText?: string;
  preferredContact?: 'call' | 'chat' | 'both';
}

export interface CreateVehiclePayload {
  categorySlug: string;
  locationSlug: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  kmDriven: number;
  fuelType: FuelType;
  transmission: Transmission;
  description?: string;
  specs?: CreateVehicleSpecsPayload;
  sellerName: string;
  sellerPhone: string;
}

export function createVehicle(payload: CreateVehiclePayload): Promise<{ id: string }> {
  return request<{ id: string }>('/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export type EnquiryChannel = 'chat' | 'call';

export interface CreateEnquiryPayload {
  vehiclePublicId: number;
  channel: EnquiryChannel;
  customerName: string;
  customerPhone: string;
  message?: string;
}

export interface CreateEnquiryResult {
  enquiry: { id: string; status: string; channel: EnquiryChannel };
  conversationId?: string;
  /** Only present for channel: 'chat' — bearer token for the message/socket endpoints. */
  accessToken?: string;
}

export function createEnquiry(payload: CreateEnquiryPayload): Promise<CreateEnquiryResult> {
  return request<CreateEnquiryResult>('/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export interface EnquiryMessage {
  id: string;
  conversationId: string;
  senderType: 'customer' | 'agent';
  senderId: string;
  body: string;
  createdAt: string;
}

export function getEnquiryMessages(
  enquiryId: string,
  accessToken: string,
): Promise<EnquiryMessage[]> {
  return request<EnquiryMessage[]>(`/enquiries/${enquiryId}/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function sendEnquiryMessage(
  enquiryId: string,
  accessToken: string,
  body: string,
): Promise<EnquiryMessage> {
  return request<EnquiryMessage>(`/enquiries/${enquiryId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ body }),
  });
}

export function uploadVehicleMedia(
  vehicleId: string,
  files: File[],
): Promise<Array<{ id: string; url: string }>> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  // No Content-Type header: fetch sets the multipart boundary itself when
  // given a FormData body, and overriding it manually breaks the upload.
  return request<Array<{ id: string; url: string }>>(`/vehicles/${vehicleId}/media`, {
    method: 'POST',
    body: formData,
  });
}

// --- Customer OTP auth (Phase 4) ---

export interface CustomerUser {
  id: string;
  name: string | null;
  phone: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function requestOtp(
  phone: string,
  referralCode?: string,
): Promise<{ message: string }> {
  return request('/auth/customer/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, referralCode }),
  });
}

export function verifyOtp(
  phone: string,
  otp: string,
  name?: string,
): Promise<{ user: CustomerUser; tokens: TokenPair }> {
  return request('/auth/customer/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, name }),
  });
}

function authHeader(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

// --- Favorites ---

export function toggleFavorite(
  accessToken: string,
  vehiclePublicId: number,
): Promise<{ favorited: boolean }> {
  return request(`/favorites/${vehiclePublicId}/toggle`, {
    method: 'POST',
    headers: authHeader(accessToken),
  });
}

export function getFavorites(accessToken: string): Promise<Vehicle[]> {
  return request('/favorites', { headers: authHeader(accessToken) });
}

// Only worth calling on the vehicle detail page (one request) — not per
// card in a listing grid, which would be one request per card.
export function checkFavorited(
  accessToken: string,
  vehiclePublicId: number,
): Promise<{ favorited: boolean }> {
  return request(`/favorites/${vehiclePublicId}`, { headers: authHeader(accessToken) });
}

// --- Customer's own enquiries ---

export interface MyEnquiry {
  id: string;
  channel: EnquiryChannel;
  status: 'open' | 'contacted' | 'negotiating' | 'closed_won' | 'closed_lost';
  message: string | null;
  createdAt: string;
  vehicle: { id: string; publicId: number | null; slug: string; title: string };
  agent: { id: string; name: string | null } | null;
}

export function getMyEnquiries(accessToken: string): Promise<MyEnquiry[]> {
  return request('/enquiries/me', { headers: authHeader(accessToken) });
}

// --- Notifications ---

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

export function getNotifications(accessToken: string): Promise<AppNotification[]> {
  return request('/notifications', { headers: authHeader(accessToken) });
}

export interface ReferralInfo {
  referralCode: string;
  totalReferred: number;
}

export function getReferralInfo(accessToken: string): Promise<ReferralInfo> {
  return request('/users/me/referral', { headers: authHeader(accessToken) });
}

export function markNotificationRead(
  accessToken: string,
  id: string,
): Promise<AppNotification> {
  return request(`/notifications/${id}/read`, {
    method: 'POST',
    headers: authHeader(accessToken),
  });
}

export function markAllNotificationsRead(accessToken: string): Promise<void> {
  return request('/notifications/read-all', {
    method: 'POST',
    headers: authHeader(accessToken),
  });
}

// --- Reviews ---

export interface VehicleReview {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string | null;
  createdAt: string;
}

export interface VehicleReviewSummary {
  reviews: VehicleReview[];
  average: number | null;
  count: number;
}

export function getVehicleReviews(vehiclePublicId: number): Promise<VehicleReviewSummary> {
  return request(`/reviews/vehicle/${vehiclePublicId}`);
}

export function createReview(
  accessToken: string,
  payload: { vehiclePublicId?: number; agentId?: string; rating: number; comment?: string },
): Promise<VehicleReview> {
  return request('/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(accessToken) },
    body: JSON.stringify(payload),
  });
}
