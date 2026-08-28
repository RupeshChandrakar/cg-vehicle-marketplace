import { API_BASE_URL } from '@/config/api';
import type { AdminVehicle, PaginatedResult, VehicleStatus } from '@/types/vehicle';
import type {
  AdminCallLog,
  AdminEnquiry,
  CallOutcome,
  EnquiryMessage,
  EnquiryStatus,
} from '@/types/enquiry';

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
): Promise<PaginatedResult<AdminVehicle>> {
  const query = status ? `?status=${status}` : '';
  return request(`/admin/vehicles${query}`, accessToken);
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
): Promise<PaginatedResult<AdminEnquiry>> {
  const query = status ? `?status=${status}` : '';
  return request(`/admin/enquiries${query}`, accessToken);
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
