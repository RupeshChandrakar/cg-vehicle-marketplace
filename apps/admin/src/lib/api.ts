import { API_BASE_URL } from '@/config/api';
import type {
  AdminVehicle,
  AdminVehicleMedia,
  Category,
  Location,
  PaginatedResult,
  UpdateVehiclePayload,
  VehicleStatus,
} from '@/types/vehicle';
import type {
  AdminCallLog,
  AdminEnquiry,
  CallOutcome,
  EnquiryMessage,
  EnquiryStatus,
} from '@/types/enquiry';
import type { AppNotification } from '@/types/notification';
import type { Reel, ReelTemplate, ReelPublishStatus } from '@/types/reel';
import type { AnalyticsSummary } from '@/types/analytics';
import type { AdminFinanceEnquiry, FinanceEnquiryStatus } from '@/types/finance-enquiry';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  accessToken: string | null,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store', ...init, headers });

  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

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

export interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function staffLogin(
  email: string,
  password: string,
): Promise<{ user: StaffUser; tokens: TokenPair }> {
  return request('/auth/staff/login', null, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export function getAdminVehicles(
  accessToken: string,
  status?: VehicleStatus,
  pageSize?: number,
): Promise<PaginatedResult<AdminVehicle>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (pageSize) params.set('pageSize', String(pageSize));
  const query = params.toString();
  return request(`/admin/vehicles${query ? `?${query}` : ''}`, accessToken);
}

export function approveVehicle(
  accessToken: string,
  id: string,
  notes?: string,
): Promise<AdminVehicle> {
  return request(`/admin/vehicles/${id}/approve`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
}

export function getAdminVehicle(accessToken: string, id: string): Promise<AdminVehicle> {
  return request(`/admin/vehicles/${id}`, accessToken);
}

export function updateVehicle(
  accessToken: string,
  id: string,
  payload: UpdateVehiclePayload,
): Promise<AdminVehicle> {
  return request(`/admin/vehicles/${id}`, accessToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Public reference data (same endpoints the customer app uses) — no
// admin-specific wrapper needed since these aren't role-gated.
export function getCategories(): Promise<Category[]> {
  return request('/categories', null);
}

export function getLocations(): Promise<Location[]> {
  return request('/locations', null);
}

export function addVehiclePhotosAsStaff(
  accessToken: string,
  vehicleId: string,
  files: File[],
): Promise<AdminVehicleMedia[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  // No Content-Type header: fetch sets the multipart boundary itself when
  // given a FormData body, and overriding it manually breaks the upload.
  return request(`/admin/vehicles/${vehicleId}/media`, accessToken, {
    method: 'POST',
    body: formData,
  });
}

export function removeVehiclePhoto(
  accessToken: string,
  vehicleId: string,
  mediaId: string,
): Promise<void> {
  return request(`/admin/vehicles/${vehicleId}/media/${mediaId}`, accessToken, {
    method: 'DELETE',
  });
}

export function reorderVehiclePhotos(
  accessToken: string,
  vehicleId: string,
  mediaIds: string[],
): Promise<void> {
  return request(`/admin/vehicles/${vehicleId}/media/reorder`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaIds }),
  });
}

export function rejectVehicle(
  accessToken: string,
  id: string,
  reason: string,
): Promise<AdminVehicle> {
  return request(`/admin/vehicles/${id}/reject`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
}

export function getAdminEnquiries(
  accessToken: string,
  status?: EnquiryStatus,
  pageSize?: number,
): Promise<PaginatedResult<AdminEnquiry>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (pageSize) params.set('pageSize', String(pageSize));
  const query = params.toString();
  return request(`/admin/enquiries${query ? `?${query}` : ''}`, accessToken);
}

export function getAdminEnquiry(accessToken: string, id: string): Promise<AdminEnquiry> {
  return request(`/admin/enquiries/${id}`, accessToken);
}

export function getAdminEnquiryMessages(
  accessToken: string,
  id: string,
): Promise<EnquiryMessage[]> {
  return request(`/admin/enquiries/${id}/messages`, accessToken);
}

export function suggestEnquiryReply(
  accessToken: string,
  id: string,
): Promise<{ suggestion: string }> {
  return request(`/admin/enquiries/${id}/suggest-reply`, accessToken, { method: 'POST' });
}

export function sendAdminEnquiryMessage(
  accessToken: string,
  id: string,
  body: string,
): Promise<EnquiryMessage> {
  return request(`/admin/enquiries/${id}/messages`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
}

export function updateEnquiryStatus(
  accessToken: string,
  id: string,
  status: EnquiryStatus,
): Promise<AdminEnquiry> {
  return request(`/admin/enquiries/${id}/status`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function logEnquiryCall(
  accessToken: string,
  id: string,
  outcome: CallOutcome,
  notes?: string,
): Promise<AdminCallLog> {
  return request(`/admin/enquiries/${id}/call-logs`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outcome, notes }),
  });
}

export function getNotifications(accessToken: string): Promise<AppNotification[]> {
  return request('/notifications', accessToken);
}

export function markNotificationRead(accessToken: string, id: string): Promise<AppNotification> {
  return request(`/notifications/${id}/read`, accessToken, { method: 'POST' });
}

export function markAllNotificationsRead(accessToken: string): Promise<void> {
  return request('/notifications/read-all', accessToken, { method: 'POST' });
}

export function createReel(
  accessToken: string,
  vehicleId: string,
  template: ReelTemplate,
): Promise<Reel> {
  return request('/admin/reels', accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicleId, template }),
  });
}

export function getAdminReels(accessToken: string): Promise<PaginatedResult<Reel>> {
  return request('/admin/reels?pageSize=50', accessToken);
}

export function getAdminReel(accessToken: string, id: string): Promise<Reel> {
  return request(`/admin/reels/${id}`, accessToken);
}

export function getAnalyticsSummary(accessToken: string): Promise<AnalyticsSummary> {
  return request('/admin/analytics/summary', accessToken);
}

export function getFinanceEnquiries(
  accessToken: string,
  status?: FinanceEnquiryStatus,
  pageSize?: number,
): Promise<PaginatedResult<AdminFinanceEnquiry>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (pageSize) params.set('pageSize', String(pageSize));
  const query = params.toString();
  return request(`/admin/finance-enquiries${query ? `?${query}` : ''}`, accessToken);
}

export function updateFinanceEnquiryStatus(
  accessToken: string,
  id: string,
  status: FinanceEnquiryStatus,
): Promise<AdminFinanceEnquiry> {
  return request(`/admin/finance-enquiries/${id}/status`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function updateReelPublishStatus(
  accessToken: string,
  id: string,
  publishStatus: ReelPublishStatus,
  platform?: string,
): Promise<Reel> {
  return request(`/admin/reels/${id}/publish-status`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publishStatus, platform }),
  });
}
