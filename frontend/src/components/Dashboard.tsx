import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhoneIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { analyticsService, DashboardSummary, FundraisingAnalytics, OpportunityMetrics, TaskAnalytics, ContactAnalytics } from '../services/analyticsApi';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'gray';
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

interface ChartData {
  name: string;
  value: number;
  fill?: string;
  [key: string]: any;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

interface DashboardProps {
  onNavigateToContacts: (filter?: string) => void;
  onNavigateToOrganizations: (filter?: string) => void;
  onNavigateToFundraising: (filter?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToContacts, onNavigateToOrganizations, onNavigateToFundraising }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [fundraisingAnalytics, setFundraisingAnalytics] = useState<FundraisingAnalytics | null>(null);
  const [opportunityMetrics, setOpportunityMetrics] = useState<OpportunityMetrics | null>(null);
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(null);
  const [contactAnalytics, setContactAnalytics] = useState<ContactAnalytics | null>(null);



  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summary, fundraising, opportunities, tasks, contacts] = await Promise.all([
        analyticsService.getDashboardSummary(),
        analyticsService.getFundraisingAnalytics(),
        analyticsService.getOpportunityMetrics(),
        analyticsService.getTaskAnalytics(),
        analyticsService.getContactAnalytics(),
      ]);

      setDashboardSummary(summary);
      setFundraisingAnalytics(fundraising);
      setOpportunityMetrics(opportunities);
      setTaskAnalytics(tasks);
      setContactAnalytics(contacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleChartClick = (type: 'priority' | 'pipeline' | 'category' | 'task_type' | 'organization', name: string, value: number) => {
    switch (type) {
      case 'priority':
        // Navigate to fundraising page with priority filter
        const priorityMap = { 'High (A)': 'A', 'Medium (B)': 'B', 'Low (C)': 'C' };
        const priorityKey = priorityMap[name as keyof typeof priorityMap] || name;
        onNavigateToFundraising(`priority:${priorityKey}`);
        break;

      case 'pipeline':
        // Navigate to opportunities/tasks page with pipeline stage filter
        // For now, navigate to fundraising as it contains opportunity data
        onNavigateToFundraising(`stage:${name.toLowerCase().replace(' ', '_')}`);
        break;

      case 'category':
        // Navigate to fundraising page with category filter
        onNavigateToFundraising(`category:${name}`);
        break;

      case 'task_type':
        // Navigate to tasks page - but we don't have a dedicated tasks view yet
        // For now, navigate to fundraising as it might contain task-related data
        onNavigateToFundraising(`task_type:${name}`);
        break;

      case 'organization':
        // Navigate to contacts page with organization filter
        onNavigateToContacts(`organization:${name}`);
        break;
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">Loading Analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Error Loading Dashboard</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardSummary || !fundraisingAnalytics || !opportunityMetrics || !taskAnalytics || !contactAnalytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Dashboard data is not available at the moment.</p>
        </div>
      </div>
    );
  }

  // Transform data for charts
  const priorityData: ChartData[] = Object.entries(fundraisingAnalytics.status_distribution).map(([name, value]) => ({
    name: name === 'Open' ? 'Active' : name === 'Closed' ? 'Completed' : name === 'Invested' ? 'Successful' : name,
    value,
  }));

  const categoryData: ChartData[] = Object.entries(fundraisingAnalytics.investor_type_breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({
      name: name.length > 15 ? name.substring(0, 12) + '...' : name,
      value,
    }));

  const taskTypeData: ChartData[] = Object.entries(taskAnalytics.task_types).map(([name, value]) => ({
    name: name.replace(/^\d+\s*-\s*/, ''), // Remove number prefixes
    value,
  }));

  const opportunityPipelineData: ChartData[] = [
    { name: 'New', value: opportunityMetrics.pipeline_stages.new },
    { name: 'Contacted', value: opportunityMetrics.pipeline_stages.contacted },
    { name: 'In Process', value: opportunityMetrics.pipeline_stages.in_process },
    { name: 'Advanced', value: opportunityMetrics.pipeline_stages.advanced },
    { name: 'Completed', value: opportunityMetrics.pipeline_stages.completed },
  ];

  const topOrganizations: ChartData[] = Object.entries(contactAnalytics.organization_distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name: name.length > 20 ? name.substring(0, 17) + '...' : name,
      value,
    }));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Niveshya Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">Investment tracking and lead management insights</p>
            </div>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Fundraising Targets"
            value={dashboardSummary.fundraising_targets.total_targets}
            icon={CurrencyDollarIcon}
            color="blue"
            subtitle={`${dashboardSummary.fundraising_targets.high_priority_targets} high priority`}
          />
          <KPICard
            title="Active Opportunities"
            value={dashboardSummary.opportunities.in_process}
            icon={ArrowTrendingUpIcon}
            color="green"
            subtitle={`${dashboardSummary.opportunities.total_opportunities} total opportunities`}
          />
          <KPICard
            title="Task Completion Rate"
            value={`${dashboardSummary.tasks.completion_rate}%`}
            icon={CheckCircleIcon}
            color="purple"
            subtitle={`${dashboardSummary.tasks.completed_tasks}/${dashboardSummary.tasks.total_tasks} completed`}
          />
          <KPICard
            title="Network Contacts"
            value={dashboardSummary.contacts.total_contacts}
            icon={UserGroupIcon}
            color="indigo"
            subtitle={`${dashboardSummary.contacts.organizations} organizations`}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Fundraising Priority Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fundraising Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data: any) => handleChartClick('priority', data.name, data.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Opportunity Pipeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunity Pipeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={opportunityPipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6" 
                  onClick={(data: any) => handleChartClick('pipeline', data.name, data.value)}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Target Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill="#10B981" 
                  onClick={(data: any) => handleChartClick('category', data.name, data.value)}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Task Types */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data: any) => handleChartClick('task_type', data.name, data.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {taskTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Top Organizations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Organizations by Contact Count</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topOrganizations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill="#8B5CF6" 
                  onClick={(data: any) => handleChartClick('organization', data.name, data.value)}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Contact Quality */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <PhoneIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Contact Quality</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">With Phone</span>
                <span className="text-sm font-medium">{contactAnalytics.data_quality_metrics.with_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">With Email</span>
                <span className="text-sm font-medium">{contactAnalytics.data_quality_metrics.with_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Complete Profiles</span>
                <span className="text-sm font-medium">{contactAnalytics.data_quality_metrics.complete_profiles}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-blue-600">Data Completeness</span>
                  <span className="text-sm font-bold text-blue-600">{contactAnalytics.network_value.data_completeness}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Task Efficiency */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <ClipboardDocumentListIcon className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Task Efficiency</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium">{taskAnalytics.completion_metrics.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-sm font-medium">{taskAnalytics.completion_metrics.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Overdue</span>
                <span className="text-sm font-medium text-red-600">{taskAnalytics.timing_analysis.overdue_tasks}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-600">Completion Rate</span>
                  <span className="text-sm font-bold text-green-600">{taskAnalytics.completion_metrics.completion_rate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Health */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <ChartBarIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Pipeline Health</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Targets</span>
                <span className="text-sm font-medium">{fundraisingAnalytics.pipeline_health.active_pipeline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">High Priority</span>
                <span className="text-sm font-medium">{fundraisingAnalytics.pipeline_health.conversion_indicators.advanced}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">With Contact Info</span>
                <span className="text-sm font-medium">{Math.round((fundraisingAnalytics.contact_data_quality.with_reference / fundraisingAnalytics.pipeline_health.total_campaigns) * 100)}%</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-purple-600">Conversion Rate</span>
                  <span className="text-sm font-bold text-purple-600">{opportunityMetrics.opportunity_health.conversion_rate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network Value */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Network Value</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Contacts</span>
                <span className="text-sm font-medium">{contactAnalytics.network_value.total_contacts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Organizations</span>
                <span className="text-sm font-medium">{contactAnalytics.network_value.unique_organizations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Connected</span>
                <span className="text-sm font-medium">{contactAnalytics.connection_metrics.connected}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-indigo-600">Connection Rate</span>
                  <span className="text-sm font-bold text-indigo-600">{contactAnalytics.network_value.connection_rate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;