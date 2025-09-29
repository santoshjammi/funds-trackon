// API configuration and base setup
const API_BASE_URL = 'http://localhost:8000';

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
  investor_type?: string;
  responsibility_tnifmc: string;
  
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
  const url = `${API_BASE_URL}${endpoint}`;
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
      if (response.status === 401 || response.status === 403) {
        throw new Error('Not authenticated or access denied (401/403). Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Contact API functions
export const contactsApi = {
  getAll: (): Promise<Contact[]> => apiRequest<Contact[]>('/api/contacts/'),
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
  getAll: (): Promise<Fundraising[]> => apiRequest<Fundraising[]>('/api/fundraising/'),
  getById: (id: string): Promise<Fundraising> => apiRequest<Fundraising>(`/api/fundraising/${id}`),
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
  getAll: (): Promise<Organization[]> => apiRequest<Organization[]>('/api/organizations/'),
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
  getAll: (): Promise<User[]> => apiRequest<User[]>('/api/users/'),
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

// Meetings API functions
export const meetingsApi = {
  create: (req: MeetingCreateRequest): Promise<MeetingCreateResponse> =>
    apiRequest<MeetingCreateResponse>('/api/meetings/', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  listByFundraising: (fundraisingId: string): Promise<MeetingListItem[]> =>
    apiRequest<MeetingListItem[]>(`/api/meetings/fundraising/${fundraisingId}`),

  details: (meetingId: string): Promise<MeetingDetails> =>
    apiRequest<MeetingDetails>(`/api/meetings/${meetingId}`),

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

  runPrompt: (meetingId: string, prompt: string): Promise<PromptResponse> =>
    apiRequest<PromptResponse>(`/api/meetings/${meetingId}/prompt`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
  
  update: (meetingId: string, body: Partial<MeetingDetails>): Promise<{message: string}> =>
    apiRequest<{message: string}>(`/api/meetings/${meetingId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
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
};

// Health check function
export const healthCheck = (): Promise<{message: string; status: string}> => 
  apiRequest<{message: string; status: string}>('/health');