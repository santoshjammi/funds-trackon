// API configuration and base setup
const API_BASE_URL = 'http://localhost:8000';

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

// Generic API request function
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
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

// Users API functions
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

// Health check function
export const healthCheck = (): Promise<{message: string; status: string}> => 
  apiRequest<{message: string; status: string}>('/health');