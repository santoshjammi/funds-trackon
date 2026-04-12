import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  DollarSign,
  Users,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Building2,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
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

const colorClass = {
  blue: 'text-blue-600 bg-blue-50',
  green: 'text-green-600 bg-green-50',
  yellow: 'text-yellow-600 bg-yellow-50',
  red: 'text-red-600 bg-red-50',
  purple: 'text-purple-600 bg-purple-50',
  indigo: 'text-indigo-600 bg-indigo-50',
  gray: 'text-gray-600 bg-gray-50',
};

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon: Icon, color, subtitle }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0
                ? <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                : <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClass[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-3">Try Again</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboardSummary || !fundraisingAnalytics || !opportunityMetrics || !taskAnalytics || !contactAnalytics) {
    return (
      <div className="text-center py-24">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">No Data Available</h2>
        <p className="text-muted-foreground">Dashboard data is not available at the moment.</p>
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
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Investment tracking and lead management insights</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Fundraising Targets" value={dashboardSummary.fundraising_targets.total_targets} icon={DollarSign} color="blue" subtitle={`${dashboardSummary.fundraising_targets.high_priority_targets} high priority`} />
          <KPICard title="Active Opportunities" value={dashboardSummary.opportunities.in_process} icon={TrendingUp} color="green" subtitle={`${dashboardSummary.opportunities.total_opportunities} total opportunities`} />
          <KPICard title="Task Completion Rate" value={`${dashboardSummary.tasks.completion_rate}%`} icon={CheckCircle2} color="purple" subtitle={`${dashboardSummary.tasks.completed_tasks}/${dashboardSummary.tasks.total_tasks} completed`} />
          <KPICard title="Network Contacts" value={dashboardSummary.contacts.total_contacts} icon={Users} color="indigo" subtitle={`${dashboardSummary.contacts.organizations} organizations`} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Fundraising Priority Distribution</CardTitle></CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Opportunity Pipeline</CardTitle></CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Target Categories</CardTitle></CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Task Distribution</CardTitle></CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Top Organizations by Contact Count</CardTitle></CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Phone className="h-5 w-5 text-blue-600" />Contact Quality</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">With Phone</span><span className="font-medium">{contactAnalytics.data_quality_metrics.with_phone}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">With Email</span><span className="font-medium">{contactAnalytics.data_quality_metrics.with_email}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Complete Profiles</span><span className="font-medium">{contactAnalytics.data_quality_metrics.complete_profiles}</span></div>
              <div className="flex justify-between text-sm pt-2 border-t"><span className="font-medium text-blue-600">Data Completeness</span><span className="font-bold text-blue-600">{contactAnalytics.network_value.data_completeness}%</span></div>
            </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-5 w-5 text-green-600" />Task Efficiency</CardTitle></CardHeader>
            <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Completed</span><span className="font-medium">{taskAnalytics.completion_metrics.completed}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pending</span><span className="font-medium">{taskAnalytics.completion_metrics.pending}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Overdue</span><span className="font-medium text-red-600">{taskAnalytics.timing_analysis.overdue_tasks}</span></div>
              <div className="flex justify-between text-sm pt-2 border-t"><span className="font-medium text-green-600">Completion Rate</span><span className="font-bold text-green-600">{taskAnalytics.completion_metrics.completion_rate}%</span></div>
            </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart2 className="h-5 w-5 text-purple-600" />Pipeline Health</CardTitle></CardHeader>
            <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Active Targets</span><span className="font-medium">{fundraisingAnalytics.pipeline_health.active_pipeline}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">High Priority</span><span className="font-medium">{fundraisingAnalytics.pipeline_health.conversion_indicators.advanced}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">With Contact Info</span><span className="font-medium">{Math.round((fundraisingAnalytics.contact_data_quality.with_reference / fundraisingAnalytics.pipeline_health.total_campaigns) * 100)}%</span></div>
              <div className="flex justify-between text-sm pt-2 border-t"><span className="font-medium text-purple-600">Conversion Rate</span><span className="font-bold text-purple-600">{opportunityMetrics.opportunity_health.conversion_rate}%</span></div>
            </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-5 w-5 text-indigo-600" />Network Value</CardTitle></CardHeader>
            <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Contacts</span><span className="font-medium">{contactAnalytics.network_value.total_contacts}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Organizations</span><span className="font-medium">{contactAnalytics.network_value.unique_organizations}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Connected</span><span className="font-medium">{contactAnalytics.connection_metrics.connected}</span></div>
              <div className="flex justify-between text-sm pt-2 border-t"><span className="font-medium text-indigo-600">Connection Rate</span><span className="font-bold text-indigo-600">{contactAnalytics.network_value.connection_rate}%</span></div>
            </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default Dashboard;