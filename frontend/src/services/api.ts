import { 
  Permission, 
  Role, 
  CreateRoleRequest, 
  UpdateRoleRequest, 
  UserRolesResponse 
} from '../types/rbac';
import {
  DocumentMetadata,
  DocumentCreateRequest,
  DocumentUpdateRequest,
  DocumentType,
  DocumentCategory,
  DocumentStatus
} from '../types/documents';

// Re-export document types for convenience
export type {
  DocumentMetadata,
  DocumentCreateRequest,
  DocumentUpdateRequest,
  DocumentType,
  DocumentCategory,
  DocumentStatus
} from '../types/documents';

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
}export interface Fundraising {
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
  email?: string;
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

  // Joplin integration (per-user)
  joplin_base_url?: string;
  joplin_api_token?: string;
  joplin_master_password?: string;

  // AI provider keys (per-user)
  openai_api_key?: string;
  claude_api_key?: string;
  openrouter_api_key?: string;
}

export interface Organization {
  id?: string;
  name: string;
  industry?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;

  // Location information
  address?: string;
  city?: string;
  country?: string;
  region?: string;

  // Business information
  size?: string;
  founded_year?: number;
  revenue?: string;

  // Relationship information
  status?: string;
  relationship_type?: string;
  priority?: string;

  // Additional information
  notes?: string;
  tags?: string[];

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface Opportunity {
  id?: string;
  title: string;
  description?: string;
  organisation: string;
  contact_id?: string;
  estimated_value?: number;
  probability?: number;
  status: string;
  priority: string;
  assigned_to?: string;
  target_close_date?: string;
  actual_close_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  task_type: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_date?: string;
  assigned_to?: string;
  assigned_by?: string;
  contact_id?: string;
  opportunity_id?: string;
  fundraising_id?: string;
  tags?: string[];
  notes?: string;
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
  getAll: (): Promise<Contact[]> => apiRequest<Contact[]>('/api/contacts').then(contacts => 
    contacts.map((contact: any) => ({ ...contact, id: contact._id || contact.id }))
  ),
  getById: (id: string): Promise<Contact> => apiRequest<Contact>(`/api/contacts/${id}`),
  create: (contact: Omit<Contact, 'id'>): Promise<{message: string, id: string}> => 
    apiRequest<{message: string, id: string}>('/api/contacts', {
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
  getAll: (): Promise<Fundraising[]> => apiRequest<Fundraising[]>('/api/fundraising').then(items => items.map((c: any) => ({
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
    apiRequest<{message: string, id: string}>('/api/fundraising', {
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
  uploadDocument: async (campaignId: string, file: File, description?: string): Promise<{
    message: string;
    campaign_id: string;
    filename: string;
    original_filename: string;
    file_size: number;
    description?: string;
    notes_updated: boolean;
  }> => {
    const url = `${API_BASE_URL}/api/fundraising/${campaignId}/upload`;
    const form = new FormData();
    form.append('file', file);
    if (description) form.append('description', description);

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
};

// Organizations API functions
export const organizationsApi = {
  getAll: (): Promise<Organization[]> => apiRequest<Organization[]>('/api/organizations'),
  getById: (id: string): Promise<Organization> => apiRequest<Organization>(`/api/organizations/${id}`),
  create: (organization: Omit<Organization, 'id'>): Promise<{message: string, id: string}> => 
    apiRequest<{message: string, id: string}>('/api/organizations', {
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
  getAll: (): Promise<User[]> => apiRequest<User[]>('/api/users'),
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
    apiRequest<MeetingCreateResponse>('/api/meetings', {
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

  delete: (meetingId: string): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/meetings/${meetingId}`, {
      method: 'DELETE',
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

  // AI Conversations
  getMeetingConversations: (meetingId: string): Promise<Array<{
    id: string;
    user_prompt: string;
    ai_response: string;
    asked_by: string;
    asked_at: string;
    model_used?: string;
    tokens_used?: number;
    context_data?: any;
  }>> => apiRequest(`/api/meetings/conversations/meeting/${meetingId}`),

  getCampaignConversations: (fundraisingId: string): Promise<Array<{
    id: string;
    user_prompt: string;
    ai_response: string;
    asked_by: string;
    asked_at: string;
    model_used?: string;
    tokens_used?: number;
    context_data?: any;
  }>> => apiRequest(`/api/meetings/conversations/campaign/${fundraisingId}`),

  getUserConversations: (limit?: number): Promise<Array<{
    id: string;
    conversation_type: string;
    meeting_id?: string;
    fundraising_id?: string;
    user_prompt: string;
    ai_response: string;
    asked_at: string;
    model_used?: string;
    tokens_used?: number;
  }>> => apiRequest(`/api/meetings/conversations/user${limit ? `?limit=${limit}` : ''}`),
};

export const opportunitiesApi = {
  getAll: (): Promise<Opportunity[]> => 
    apiRequest<Opportunity[]>('/api/opportunities'),
  
  getById: (id: string): Promise<Opportunity> => 
    apiRequest<Opportunity>(`/api/opportunities/${id}`),
  
  create: (opportunity: Omit<Opportunity, 'id'>): Promise<{message: string; id: string}> => 
    apiRequest<{message: string; id: string}>('/api/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunity),
    }),
  
  update: (id: string, opportunity: Partial<Opportunity>): Promise<{message: string}> => 
    apiRequest<{message: string}>(`/api/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(opportunity),
    }),
  
  delete: (id: string): Promise<{message: string}> => 
    apiRequest<{message: string}>(`/api/opportunities/${id}`, {
      method: 'DELETE',
    }),
};

export const tasksApi = {
  getAll: (): Promise<Task[]> => 
    apiRequest<Task[]>('/api/tasks'),
  
  getById: (id: string): Promise<Task> => 
    apiRequest<Task>(`/api/tasks/${id}`),
  
  create: (task: Omit<Task, 'id'>): Promise<{message: string; id: string}> => 
    apiRequest<{message: string; id: string}>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  
  update: (id: string, task: Partial<Task>): Promise<{message: string}> => 
    apiRequest<{message: string}>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),
  
  delete: (id: string): Promise<{message: string}> => 
    apiRequest<{message: string}>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),
};

// Health check function
export const healthCheck = (): Promise<{message: string; status: string}> => 
  apiRequest<{message: string; status: string}>('/health');

// Document/Knowledge Base API
export const documentsApi = {
  // Create a text document
  create: (document: DocumentCreateRequest): Promise<DocumentMetadata> =>
    apiRequest<DocumentMetadata>('/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    }),

  // Upload a file document
  upload: async (request: {
    file: File;
    title: string;
    description?: string;
    document_type: DocumentType;
    category?: DocumentCategory;
    fundraising_id?: string;
    organization_id?: string;
    contact_id?: string;
    task_id?: string;
    opportunity_id?: string;
    meeting_id?: string;
    tags?: string;
    is_public?: boolean;
  }): Promise<DocumentMetadata> => {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('title', request.title);
    if (request.description) formData.append('description', request.description);
    formData.append('document_type', request.document_type);
    if (request.category) formData.append('category', request.category);
    if (request.fundraising_id) formData.append('fundraising_id', request.fundraising_id);
    if (request.organization_id) formData.append('organization_id', request.organization_id);
    if (request.contact_id) formData.append('contact_id', request.contact_id);
    if (request.task_id) formData.append('task_id', request.task_id);
    if (request.opportunity_id) formData.append('opportunity_id', request.opportunity_id);
    if (request.meeting_id) formData.append('meeting_id', request.meeting_id);
    if (request.tags) formData.append('tags', request.tags);
    if (request.is_public !== undefined) formData.append('is_public', request.is_public.toString());

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // Get documents with filtering
  getAll: (params?: {
    fundraising_id?: string;
    organization_id?: string;
    contact_id?: string;
    task_id?: string;
    opportunity_id?: string;
    meeting_id?: string;
    document_type?: DocumentType;
    category?: DocumentCategory;
    status?: DocumentStatus;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<DocumentMetadata[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const url = `/api/documents${queryString ? `?${queryString}` : ''}`;
    return apiRequest<DocumentMetadata[]>(url);
  },

  // Get single document
  get: (id: string): Promise<DocumentMetadata> =>
    apiRequest<DocumentMetadata>(`/api/documents/${id}`),

  // Update document
  update: (id: string, document: DocumentUpdateRequest): Promise<DocumentMetadata> =>
    apiRequest<DocumentMetadata>(`/api/documents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    }),

  // Delete document
  delete: (id: string): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/documents/${id}`, {
      method: 'DELETE',
    }),

  // Download document file
  download: async (id: string): Promise<Blob> => {
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/documents/${id}/download`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.blob();
  },

  // Get knowledge base documents for an entity
  getKnowledgeBase: (
    entityType: 'fundraising' | 'organization' | 'contact' | 'task' | 'opportunity' | 'meeting',
    entityId: string,
    documentType?: DocumentType,
    category?: DocumentCategory
  ): Promise<DocumentMetadata[]> => {
    const queryParams = new URLSearchParams();
    if (documentType) queryParams.append('document_type', documentType);
    if (category) queryParams.append('category', category);
    const queryString = queryParams.toString();
    const url = `/api/documents/knowledge-base/${entityType}/${entityId}${queryString ? `?${queryString}` : ''}`;
    return apiRequest<DocumentMetadata[]>(url);
  },
};

// ── Joplin Integration API ────────────────────────────────────────────────────

export const joplinApi = {
  /** Check whether the backend can reach the Joplin REST API. */
  status: (): Promise<{ connected: boolean; joplin_response?: string; error?: string }> =>
    apiRequest('/api/joplin/status'),

  /** List all Joplin notebooks. */
  listNotebooks: (): Promise<Array<{ id: string; title: string; parent_id?: string }>> =>
    apiRequest('/api/joplin/notebooks'),

  /** List all Joplin tags. */
  listTags: (): Promise<Array<{ id: string; title: string }>> =>
    apiRequest('/api/joplin/tags'),

  /** List notes with optional filtering. */
  listNotes: (params?: {
    notebookId?: string;
    tagId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Array<{ id: string; title: string; body?: string; updated_time?: number }>; has_more: boolean; page: number }> => {
    const qs = new URLSearchParams();
    if (params?.notebookId) qs.append('notebook_id', params.notebookId);
    if (params?.tagId) qs.append('tag_id', params.tagId);
    if (params?.search) qs.append('search', params.search);
    if (params?.page) qs.append('page', String(params.page));
    if (params?.limit) qs.append('limit', String(params.limit));
    const q = qs.toString();
    return apiRequest(`/api/joplin/notes${q ? `?${q}` : ''}`);
  },

  /** Fetch a note's raw content — no AI processing. */
  getNote: (noteId: string): Promise<{
    note: { id: string; title: string; body: string; updated_time?: number };
  }> => apiRequest(`/api/joplin/notes/${noteId}`),

  /** Run LLM extraction on a note — does NOT save anything. */
  extractNote: (noteId: string): Promise<{
    note: { id: string; title: string; body: string };
    extracted: {
      action_items: Array<{ title: string; description?: string; priority?: string; task_type?: string }>;
      opportunities: Array<{ title: string; description?: string; organisation?: string; estimated_value?: number | null; probability?: number | null }>;
      participants: string[];
      follow_up_date: string | null;
    };
  }> => apiRequest(`/api/joplin/notes/${noteId}/extract`, { method: 'POST' }),

  /** Sync a note to the CRM — creates Tasks + Opportunities, deduplicates. */
  syncNote: (
    noteId: string,
    opts?: { fundraisingId?: string; contactId?: string; meetingId?: string }
  ): Promise<{
    skipped?: boolean;
    reason?: string;
    note_title?: string;
    tasks_created?: number;
    opportunities_created?: number;
    task_ids?: string[];
    opportunity_ids?: string[];
    last_synced_at?: string;
  }> =>
    apiRequest(`/api/joplin/sync/${noteId}`, {
      method: 'POST',
      body: JSON.stringify({
        fundraising_id: opts?.fundraisingId ?? null,
        contact_id: opts?.contactId ?? null,
        meeting_id: opts?.meetingId ?? null,
      }),
    }),

  /** List previously synced notes for a campaign, meeting, or contact. */
  listSyncedNotes: (opts: { fundraisingId?: string; meetingId?: string; contactId?: string }): Promise<Array<{
    note_id: string;
    note_title: string;
    last_synced_at: string;
    fundraising_id: string | null;
    meeting_id: string | null;
    contact_id: string | null;
    tasks_created: number;
    opportunities_created: number;
    task_ids: string[];
    opportunity_ids: string[];
    audio_url: string | null;
    infographic_url: string | null;
    has_body: boolean;
  }>> => {
    const qs = new URLSearchParams();
    if (opts.fundraisingId) qs.append('fundraising_id', opts.fundraisingId);
    if (opts.meetingId) qs.append('meeting_id', opts.meetingId);
    if (opts.contactId) qs.append('contact_id', opts.contactId);
    return apiRequest(`/api/joplin/synced-notes?${qs.toString()}`);
  },
};