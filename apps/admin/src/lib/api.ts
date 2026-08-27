import { API_BASE_URL } from '@/config/api';
import type { AdminVehicle, PaginatedResult, VehicleStatus } from '@/types/vehicle';

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
