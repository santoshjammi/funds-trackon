// Internal API request function (same pattern as existing api.ts)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const AUTH_TOKEN_KEYS = ['access_token','token','jwt','jwt_token','auth','authToken','id_token'] as const;
function getAuthToken(): string | null {
  try {
    const fromLocal = typeof localStorage !== 'undefined'
      ? AUTH_TOKEN_KEYS.map(key => localStorage.getItem(key)).find(Boolean)
      : null;
    if (fromLocal) return fromLocal;
    
    const fromSession = typeof sessionStorage !== 'undefined'
      ? AUTH_TOKEN_KEYS.map(key => sessionStorage.getItem(key)).find(Boolean)
      : null;
    if (fromSession) return fromSession;
    
    return null;
  } catch {
    return null;
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Ensure endpoint starts with / for relative URLs when API_BASE_URL is empty
  const base = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, '') : '';
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = base ? `${base}${path}` : path;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  };

  const token = getAuthToken();
  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
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
        throw new Error('Not authenticated or access denied. Please log in again.');
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.data || data; // Handle both { data: ... } and direct responses
  } catch (error) {
    console.error(`Analytics API request failed: ${endpoint}`, error);
    throw error;
  }
}

export interface DashboardSummary {
  fundraising_targets: {
    total_targets: number;
    priority_breakdown: Record<string, number>;
    category_breakdown: Record<string, number>;
    active_targets: number;
    high_priority_targets: number;
  };
  opportunities: {
    total_opportunities: number;
    in_process: number;
    completed: number;
    priority_a_opportunities: number;
  };
  tasks: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    completion_rate: number;
    meeting_tasks: number;
  };
  contacts: {
    total_contacts: number;
    connected_contacts: number;
    organizations: number;
  };
}

export interface FundraisingAnalytics {
  status_distribution: Record<string, number>;
  investor_type_breakdown: Record<string, number>;
  organization_analysis: Record<string, number>;
  pipeline_stages: Record<string, number>;
  referral_effectiveness: Record<string, number>;
  contact_data_quality: {
    with_reference: number;
    with_investor_type: number;
    with_responsibility: number;
    with_request_amount: number;
  };
  pipeline_health: {
    total_campaigns: number;
    active_pipeline: number;
    completed_campaigns: number;
    conversion_indicators: Record<string, number>;
  };
}

export interface OpportunityMetrics {
  status_distribution: Record<string, number>;
  priority_breakdown: Record<string, number>;
  category_analysis: Record<string, number>;
  pipeline_stages: {
    new: number;
    contacted: number;
    in_process: number;
    advanced: number;
    completed: number;
  };
  referral_effectiveness: Record<string, number>;
  opportunity_health: {
    total_opportunities: number;
    active_opportunities: number;
    high_priority: number;
    conversion_rate: number;
  };
}

export interface TaskAnalytics {
  task_types: Record<string, number>;
  completion_metrics: {
    completed: number;
    pending: number;
    total: number;
    completion_rate: number;
  };
  delegation_analysis: Record<string, number>;
  opportunity_linkage: {
    linked_tasks: number;
    unlinked_tasks: number;
    linkage_rate: number;
  };
  timing_analysis: {
    overdue_tasks: number;
    upcoming_tasks: number;
    completed_tasks: number;
  };
}

export interface ContactAnalytics {
  organization_distribution: Record<string, number>;
  connection_metrics: {
    connected: number;
    not_connected: number;
    total_contacts: number;
  };
  data_quality_metrics: {
    with_phone: number;
    with_email: number;
    with_designation: number;
    with_organisation: number;
    complete_profiles: number;
  };
  network_value: {
    total_contacts: number;
    unique_organizations: number;
    connection_rate: number;
    data_completeness: number;
  };
  contact_insights: {
    most_connected_orgs: Record<string, number>;
    network_diversity: number;
    average_contacts_per_org: number;
  };
}

export interface PerformanceTrends {
  fundraising_momentum: {
    active_targets: number;
    engagement_rate: number;
    referral_rate: number;
  };
  opportunity_velocity: {
    pipeline_flow: {
      new: number;
      in_progress: number;
      completed: number;
    };
  };
  task_efficiency: {
    completion_trend: number;
    meeting_effectiveness: number;
  };
}

export interface ExecutiveReport {
  executive_summary: {
    fundraising_pipeline: {
      total_targets: number;
      high_priority: number;
      active_conversations: number;
      success_indicators: number;
    };
    business_development: {
      total_opportunities: number;
      active_pipeline: number;
      conversion_rate: number;
    };
    operational_efficiency: {
      task_completion_rate: number;
      network_utilization: number;
    };
  };
  key_insights: {
    top_performing_categories: Record<string, number>;
    most_effective_referrals: Record<string, number>;
    priority_focus_areas: {
      high_priority_targets: Array<{
        target: string;
        category: string;
        status: string;
      }>;
    };
  };
  report_generated: string;
  data_freshness: {
    tracker_records: number;
    opportunity_records: number;
    task_records: number;
    contact_records: number;
  };
}

class AnalyticsService {
  /**
   * Get dashboard summary with key metrics
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    return apiRequest<DashboardSummary>('/api/analytics/dashboard-summary');
  }

  /**
   * Get detailed fundraising analytics
   */
  async getFundraisingAnalytics(): Promise<FundraisingAnalytics> {
    return apiRequest<FundraisingAnalytics>('/api/analytics/fundraising-analytics');
  }

  /**
   * Get opportunity metrics and pipeline analysis
   */
  async getOpportunityMetrics(): Promise<OpportunityMetrics> {
    return apiRequest<OpportunityMetrics>('/api/analytics/opportunity-metrics');
  }

  /**
   * Get task analytics and completion metrics
   */
  async getTaskAnalytics(): Promise<TaskAnalytics> {
    return apiRequest<TaskAnalytics>('/api/analytics/task-analytics');
  }

  /**
   * Get contact network analytics
   */
  async getContactAnalytics(): Promise<ContactAnalytics> {
    return apiRequest<ContactAnalytics>('/api/analytics/contact-analytics');
  }

  /**
   * Get performance trends over time
   */
  async getPerformanceTrends(timeframe: string = '30d'): Promise<PerformanceTrends> {
    return apiRequest<PerformanceTrends>(`/api/analytics/performance-trends?timeframe=${timeframe}`);
  }

  /**
   * Get executive report with comprehensive insights
   */
  async getExecutiveReport(): Promise<ExecutiveReport> {
    return apiRequest<ExecutiveReport>('/api/analytics/executive-report');
  }
}

export const analyticsService = new AnalyticsService();