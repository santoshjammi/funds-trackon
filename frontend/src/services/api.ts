// API configuration and base setup
// Prefer environment override; default to same-origin '' so endpoints like '/api/...'
// are not double-prefixed when behind Nginx proxying '/api' to backend.
import { 
  Permission, 
  Role, 
  CreateRoleRequest, 
  UpdateRoleRequest, 
  UserRolesResponse 
} from '../types/rbac';

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env && (process.env.REACT_APP_API_BASE_URL as string))
  || '';

// Optional auth token reader: localStorage, sessionStorage, then cookie fallback
export const AUTH_TOKEN_KEYS = ['access_token','token','jwt','jwt_token','auth','authToken','id_token'] as const;
export function getAuthToken(): string | null {
  try {
    const fromLocal = typeof localStorage !== 'undefined'
      ? (AUTH_TOKEN_KEYS.map(k => localStorage.getItem(k)).find(Boolean) || null)
      : null;
    if (fromLocal) return fromLocal;

    const fromSession = typeof sessionStorage !== 'undefined'
      ? (AUTH_TOKEN_KEYS.map(k => sessionStorage.getItem(k)).find(Boolean) || null)
      : null;
    if (fromSession) return fromSession;

    // Cookie fallback: look for access_token=...
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('access_token='));
      if (match) {
        const val = match.split('=')[1];
        return decodeURIComponent(val);
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Decode a base64url JWT payload safely
export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string | null): number | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000; // ms
}

export function isTokenExpired(token: string | null, skewMs: number = 0): boolean {
  const exp = getTokenExpiry(token);
  if (!exp) return false; // if no exp, treat as non-expiring
  return Date.now() + skewMs >= exp;
}

// Types for our data structures
export interface Contact {
  id?: string;
  organisation: string;
  name: string;
  designation?: string;
  branch_department?: string;
  email?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  geography_region?: string;
  country_location?: string;
  sub_location?: string;
  notes_comments?: string;
  
  // Added fields for better functionality
  status?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface Fundraising {
  id?: string;
  status_open_closed: string;
  date_of_first_meeting_call?: string;
  organisation: string;
  reference: string;
  tnifmc_request_inr_cr?: number;
  niveshya_request_inr_cr?: number; // new field during migration
  investor_type?: string;
  responsibility_tnifmc: string;
  responsibility_niveshya?: string; // new field during migration
  
  // Process tracking booleans
  feeler_teaser_letter_sent?: boolean;
  meetings_detailed_discussions_im_sent?: boolean;
  initial_appraisal_evaluation_process_started?: boolean;
  due_diligence_queries?: boolean;
  commitment_letter_conclusion?: boolean;
  initial_final_drawdown?: boolean;
  
  // Financial details
  commitment_amount_inr_cr?: number;
  current_status?: string;
  notes?: string;
  
  // Contact reference
  contact_id?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id?: string;
  organisation: string;
  employment_type: string;
  name: string;
  designation: string;
  email: string;
  phone?: string;
  notes?: string;
  
  // Authentication fields
  username?: string;
  password_hash?: string;
  roles?: string[];
  is_active: boolean;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

export interface Organization {
  id?: string;
  name: string;
  industry?: string;
  organization_type?: string;
  description?: string;
  website?: string;
  
  // Location information
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  geography_region?: string;
  
  // Contact information
  contact_person?: string;
  contact_designation?: string;
  phone?: string;
  email?: string;
  
  // Business information
  annual_revenue?: number;
  employee_count?: number;
  founded_year?: number;
  
  // Investment information
  investment_stage?: string;
  previous_funding?: number;
  
  // Relationship information
  relationship_status?: string;
  last_contact_date?: string;
  next_action?: string;
  
  notes?: string;
  status?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// Meetings types
export interface MeetingAttendee {
  name: string;
  designation?: string;
  organisation: string;
  email?: string;
  is_internal?: boolean;
}

export type MeetingType =
  | 'Initial Meeting'
  | 'Follow-up'
  | 'Due Diligence'
  | 'Closing'
  | 'General Discussion';

export type MeetingStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';

export interface MeetingCreateRequest {
  title: string;
  meeting_type: MeetingType;
  fundraising_id: string;
  contact_id?: string;
  scheduled_date: string; // ISO
  location?: string;
  is_virtual?: boolean;
  agenda?: string;
  attendees?: MeetingAttendee[];
  tnifmc_representatives?: string[];
  niveshya_representatives?: string[];
}

export interface MeetingListItem {
  id: string;
  title: string;
  meeting_type: MeetingType;
  status: MeetingStatus;
  scheduled_date: string;
  actual_date?: string;
  duration_minutes?: number;
  location?: string;
  is_virtual?: boolean;
  has_audio: boolean;
  audio_processing_status?: string | null;
  created_at: string;
}

export interface MeetingCreateResponse {
  message: string;
  meeting_id: string;
  meeting: any;
}

// Detailed Meeting response
export interface MeetingDetails {
  id: string;
  title: string;
  meeting_type: MeetingType;
  status: MeetingStatus;
  scheduled_date: string;
  actual_date?: string;
  duration_minutes?: number;
  location?: string;
  is_virtual?: boolean;
  agenda?: string;
  notes?: string | null;
  attendees?: MeetingAttendee[];
  tnifmc_representatives?: string[];
  has_audio: boolean;
  audio_filename?: string;
  audio_processing_status?: string | null;
  transcript?: string | null;
  ai_summary?: string | null;
  ai_action_items?: string[] | string | null;
  ai_risks?: string[] | string | null;
  ai_next_steps?: string[] | string | null;
  // Infographic fields
  infographic_url?: string | null;
  infographic_description?: string | null;
  infographic_generated_at?: string | null;
  // Dub fields
  dub_url?: string | null;
  dub_generated_at?: string | null;
  dub_voice?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PromptResponse {
  message: string;
  result?: string;
  status?: string;
}

// Helper to parse filename from Content-Disposition header
function parseFilenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = header.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const encoded = match?.[1];
  const plain = match?.[2];
  if (encoded) {
    try { return decodeURIComponent(encoded); } catch { return fallback; }
  }
  return plain || fallback;
}

// Generic API request function
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Join base and endpoint without duplicating slashes
  const base = API_BASE_URL.replace(/\/+$/, '');
  const url = `${base}${endpoint}`;
  const openaiKey = (typeof localStorage !== 'undefined') ? localStorage.getItem('openai_api_key') : null;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  };

  // Attach Authorization header if token available and not already set
  const token = getAuthToken();
  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  if (openaiKey && !('X-OpenAI-API-Key' in (config.headers as Record<string, string>))) {
    (config.headers as Record<string, string>)['X-OpenAI-API-Key'] = openaiKey;
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Try to get error details from the response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If parsing JSON fails, keep the HTTP status message
      }
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('Not authenticated or access denied (401/403). Please log in again.');
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Contact API functions
export const contactsApi = {
  getAll: (limit: number = 10000): Promise<Contact[]> => apiRequest<Contact[]>(`/api/contacts/?limit=${limit}`),
  getById: (id: string): Promise<Contact> => apiRequest<Contact>(`/api/contacts/${id}`),
  create: (contact: Omit<Contact, 'id'>): Promise<{message: string, id: string}> => 
    apiRequest<{message: string, id: string}>('/api/contacts/', {
      method: 'POST',
      body: JSON.stringify(contact),
    }),
  update: (id: string, contact: Partial<Contact>): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    }),
  delete: (id: string): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/contacts/${id}`, {
      method: 'DELETE',
    }),
};

// Fundraising API functions
export const fundraisingApi = {
  getAll: (): Promise<Fundraising[]> => apiRequest<Fundraising[]>('/api/fundraising/?limit=10000').then(items => items.map((c: any) => ({
    ...c,
    // prefer new fields if present
    tnifmc_request_inr_cr: c.niveshya_request_inr_cr ?? c.tnifmc_request_inr_cr,
    responsibility_tnifmc: c.responsibility_niveshya ?? c.responsibility_tnifmc,
  }))),
  getById: (id: string): Promise<Fundraising> => apiRequest<Fundraising>(`/api/fundraising/${id}`).then((c: any) => ({
    ...c,
    tnifmc_request_inr_cr: c.niveshya_request_inr_cr ?? c.tnifmc_request_inr_cr,
    responsibility_tnifmc: c.responsibility_niveshya ?? c.responsibility_tnifmc,
  })),
  create: (fundraising: Omit<Fundraising, 'id'>): Promise<{message: string, id: string}> =>
    apiRequest<{message: string, id: string}>('/api/fundraising/', {
      method: 'POST',
      body: JSON.stringify(fundraising),
    }),
  update: (id: string, fundraising: Partial<Fundraising>): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/fundraising/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fundraising),
    }),
  delete: (id: string): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/fundraising/${id}`, {
      method: 'DELETE',
    }),
};

// Organizations API functions
export const organizationsApi = {
  getAll: (): Promise<Organization[]> => apiRequest<Organization[]>('/api/organizations/?limit=10000'),
  getById: (id: string): Promise<Organization> => apiRequest<Organization>(`/api/organizations/${id}`),
  create: (organization: Omit<Organization, 'id'>): Promise<{message: string, id: string}> => 
    apiRequest<{message: string, id: string}>('/api/organizations/', {
      method: 'POST',
      body: JSON.stringify(organization),
    }),
  update: (id: string, organization: Partial<Organization>): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(organization),
    }),
  delete: (id: string): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/organizations/${id}`, {
      method: 'DELETE',
    }),
};

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  designation: string;
  employment_type?: string;
  username?: string;
}

// Authentication API functions
export const authApi = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  loginUsername: (credentials: {username: string, password: string}): Promise<LoginResponse> =>
    apiRequest<LoginResponse>('/api/auth/login-username', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  register: (userData: RegisterRequest): Promise<{message: string, user_id: string}> =>
    apiRequest<{message: string, user_id: string}>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

// Enhanced Users API functions with password management
export const usersApi = {
  getAll: (): Promise<User[]> => apiRequest<User[]>('/api/users/?limit=10000'),
  getById: (id: string): Promise<User> => apiRequest<User>(`/api/users/${id}`),
  update: (id: string, user: Partial<User>): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    }),
  delete: (id: string): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/users/${id}`, {
      method: 'DELETE',
    }),
  
  // Password management
  setPassword: (id: string, password: string): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/users/${id}/set-password`, {
      method: 'POST',
      body: JSON.stringify({password}),
    }),
  
  changePassword: (id: string, currentPassword: string, newPassword: string): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/users/${id}/change-password`, {
      method: 'POST',
      body: JSON.stringify({current_password: currentPassword, new_password: newPassword}),
    }),
  
  hasPassword: (id: string): Promise<{user_id: string, has_password: boolean}> =>
    apiRequest<{user_id: string, has_password: boolean}>(`/api/users/${id}/has-password`),
};

// RBAC API functions
export const rolesApi = {
  // Get all permissions
  getPermissions: (): Promise<Permission[]> =>
    apiRequest<Permission[]>('/api/roles/permissions'),
  
  // Get all roles
  getRoles: (): Promise<Role[]> =>
    apiRequest<Role[]>('/api/roles'),
  
  // Get specific role
  getRole: (roleId: string): Promise<Role> =>
    apiRequest<Role>(`/api/roles/${roleId}`),
  
  // Create new role
  createRole: (role: CreateRoleRequest): Promise<Role> =>
    apiRequest<Role>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(role),
    }),
  
  // Update role
  updateRole: (roleId: string, role: UpdateRoleRequest): Promise<Role> =>
    apiRequest<Role>(`/api/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(role),
    }),
  
  // Delete role
  deleteRole: (roleId: string): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/roles/${roleId}`, {
      method: 'DELETE',
    }),
  
  // Assign role to user
  assignRole: (userId: string, roleId: string): Promise<{message: string}> =>
    apiRequest<{message: string}>('/api/roles/assign', {
      method: 'POST',
      body: JSON.stringify({user_id: userId, role_id: roleId}),
    }),
  
  // Unassign role from user
  unassignRole: (userId: string, roleId: string): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/roles/unassign/${userId}/${roleId}`, {
      method: 'DELETE',
    }),
  
  // Get user roles
  getUserRoles: (userId: string): Promise<UserRolesResponse> =>
    apiRequest<UserRolesResponse>(`/api/roles/user/${userId}`),
};

// Meetings API functions
export const meetingsApi = {
  create: (req: MeetingCreateRequest): Promise<MeetingCreateResponse> =>
    apiRequest<MeetingCreateResponse>('/api/meetings/', {
      method: 'POST',
      body: JSON.stringify({
        ...req,
        // prefer new field name; keep legacy for compatibility until backend flips
        tnifmc_representatives: req.niveshya_representatives ?? req.tnifmc_representatives,
        niveshya_representatives: req.niveshya_representatives ?? req.tnifmc_representatives,
      }),
    }),

  listByFundraising: (fundraisingId: string): Promise<MeetingListItem[]> =>
    apiRequest<MeetingListItem[]>(`/api/meetings/fundraising/${fundraisingId}`),

  details: (meetingId: string): Promise<MeetingDetails> =>
    apiRequest<any>(`/api/meetings/${meetingId}`).then((raw) => {
      const m = raw?.meeting || raw;
      const id = m.id || m._id || meetingId;
      const details: MeetingDetails = {
        id,
        title: m.title,
        meeting_type: m.meeting_type,
        status: m.status,
        scheduled_date: m.scheduled_date,
        actual_date: m.actual_date,
        duration_minutes: m.duration_minutes,
        location: m.location,
        is_virtual: m.is_virtual,
        agenda: m.agenda,
        notes: m.notes ?? null,
        attendees: m.attendees,
        tnifmc_representatives: m.tnifmc_representatives,
        has_audio: Boolean(m.audio_recording),
        audio_filename: m.audio_recording?.filename,
        audio_processing_status: m.audio_recording?.processing_status ?? null,
        transcript: m.audio_recording?.transcript ?? null,
        ai_summary: m.ai_summary ?? null,
        ai_action_items: m.ai_action_items ?? null,
        ai_risks: m.ai_insights?.risks_concerns ?? null,
        ai_next_steps: m.ai_insights?.follow_up_needed ?? null,
        infographic_url: m.infographic_filename ? `${API_BASE_URL}/api/meetings/${id}/infographic` : null,
        infographic_description: m.infographic_description ?? null,
        infographic_generated_at: m.infographic_generated_at ?? null,
        dub_url: m.dub_filename ? `${API_BASE_URL}/api/meetings/${id}/autodub` : null,
        dub_generated_at: m.dub_generated_at ?? null,
        dub_voice: m.dub_voice ?? null,
        created_at: m.created_at,
        updated_at: m.updated_at,
      };
      return details;
    }),

  uploadAudio: async (meetingId: string, file: File): Promise<{message: string; meeting_id: string; audio_filename: string; file_size: number; processing_status: string}> => {
    const url = `${API_BASE_URL}/api/meetings/${meetingId}/audio`;
    const form = new FormData();
    form.append('audio_file', file);

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'POST',
      headers, // do NOT set Content-Type for FormData
      body: form,
    });
    if (!res.ok) {
      try {
        const err = await res.json();
        throw new Error(err?.detail || `Upload failed: ${res.status}`);
      } catch {
        const text = await res.text();
        throw new Error(text || `Upload failed: ${res.status}`);
      }
    }
    return res.json();
  },

  processAudio: (meetingId: string, force: boolean = false): Promise<{message: string; status: string; transcript?: string; analysis?: any}> =>
    apiRequest<{message: string; status: string; transcript?: string; analysis?: any}>(`/api/meetings/${meetingId}/process-audio${force ? '?force=true' : ''}` , {
      method: 'POST',
    }),

  runPrompt: async (meetingId: string, prompt: string): Promise<PromptResponse> => {
    // The backend returns { message, response } for custom prompt. Normalize to { result } for UI.
    const raw: any = await apiRequest<any>(`/api/meetings/${meetingId}/prompt`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    return {
      message: raw?.message ?? 'OK',
      result: raw?.result ?? raw?.response,
      status: raw?.status,
    };
  },
  runCampaignPrompt: async (fundraisingId: string, prompt: string, meetingIds?: string[]): Promise<PromptResponse> => {
    const raw: any = await apiRequest<any>(`/api/meetings/fundraising/${fundraisingId}/prompt`, {
      method: 'POST',
      body: JSON.stringify({ prompt, meeting_ids: meetingIds && meetingIds.length ? meetingIds : undefined }),
    });
    return {
      message: raw?.message ?? 'OK',
      result: raw?.result ?? raw?.response,
      status: raw?.status,
    };
  },
  
  update: (meetingId: string, body: Partial<MeetingDetails>): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/meetings/${meetingId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...body,
        tnifmc_representatives: (body as any).niveshya_representatives ?? (body as any).tnifmc_representatives,
        niveshya_representatives: (body as any).niveshya_representatives ?? (body as any).tnifmc_representatives,
      }),
    }),

  // Downloads
  downloadAudio: async (meetingId: string): Promise<{ blob: Blob; filename: string }> => {
    const url = `${API_BASE_URL}/api/meetings/${meetingId}/audio`;
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const cd = res.headers.get('content-disposition');
    const filename = parseFilenameFromContentDisposition(cd, 'meeting_audio');
    const blob = await res.blob();
    return { blob, filename };
  },

  downloadTranscript: async (meetingId: string): Promise<{ blob: Blob; filename: string }> => {
    const url = `${API_BASE_URL}/api/meetings/${meetingId}/transcript`;
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const cd = res.headers.get('content-disposition');
    const filename = parseFilenameFromContentDisposition(cd, 'meeting_transcript.txt');
    const blob = await res.blob();
    return { blob, filename };
  },

  generateInfographic: (meetingId: string, description: string): Promise<{message: string; filename: string; url: string}> =>
    apiRequest<{message: string; filename: string; url: string}>(`/api/meetings/${meetingId}/infographic`, {
      method: 'POST',
      body: JSON.stringify({ description }),
    }),
  generateDub: (meetingId: string, voice: string = 'alloy', format: 'mp3' | 'wav' | 'ogg' = 'mp3'): Promise<{message: string; filename: string; url: string; text: string}> =>
    apiRequest<{message: string; filename: string; url: string; text: string}>(`/api/meetings/${meetingId}/autodub`, {
      method: 'POST',
      body: JSON.stringify({ voice, format }),
    }),

  downloadDub: async (meetingId: string): Promise<{ blob: Blob; filename: string }> => {
    const url = `${API_BASE_URL}/api/meetings/${meetingId}/autodub`;
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const cd = res.headers.get('content-disposition');
    const filename = parseFilenameFromContentDisposition(cd, 'meeting_autodub');
    const blob = await res.blob();
    return { blob, filename };
  },
};

// Health check function
export const healthCheck = (): Promise<{message: string; status: string}> => 
  apiRequest<{message: string; status: string}>('/health');