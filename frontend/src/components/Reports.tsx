import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Filter,
  BarChart3,
  Table2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { analyticsService, ExecutiveReport } from '../services/analyticsApi';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';
import { SelectNative } from './ui/select-native';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

interface FilterOptions {
  dateRange: 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';
  startDate?: string;
  endDate?: string;
  categories?: string[];
  priorities?: string[];
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executiveReport, setExecutiveReport] = useState<ExecutiveReport | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'thisMonth'
  });

  // Helper function to get width class based on percentage
  const getWidthClass = (percentage: number): string => {
    if (percentage >= 90) return 'w-full';
    if (percentage >= 75) return 'w-3/4';
    if (percentage >= 66) return 'w-2/3';
    if (percentage >= 50) return 'w-1/2';
    if (percentage >= 33) return 'w-1/3';
    if (percentage >= 25) return 'w-1/4';
    if (percentage >= 10) return 'w-1/12';
    return 'w-1';
  };

  useEffect(() => {
    loadExecutiveReport();
  }, [filters]);

  const loadExecutiveReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await analyticsService.getExecutiveReport();
      setExecutiveReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load executive report');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: FilterOptions['dateRange']) => {
    const today = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (range) {
      case 'last7days':
        startDate = format(subDays(today, 7), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'last30days':
        startDate = format(subDays(today, 30), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'thisMonth':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(today), 1);
        startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        break;
      case 'thisYear':
        startDate = format(startOfYear(today), 'yyyy-MM-dd');
        endDate = format(endOfYear(today), 'yyyy-MM-dd');
        break;
    }

    setFilters({
      ...filters,
      dateRange: range,
      startDate,
      endDate
    });
  };

  const exportToPDF = () => {
    // In a real implementation, you would use a library like jsPDF or html2pdf
    alert('PDF export would be implemented here using libraries like jsPDF or html2pdf');
  };

  const exportToExcel = () => {
    // In a real implementation, you would use a library like xlsx or exceljs
    alert('Excel export would be implemented here using libraries like xlsx or exceljs');
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-48" />
          <div className="flex gap-2"><Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-24" /></div>
        </div>
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
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
            <Button variant="outline" size="sm" onClick={loadExecutiveReport} className="ml-3">Try Again</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comprehensive analytics and executive insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Table2 className="h-4 w-4 mr-2" />Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={printReport}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Date Range</Label>
              <SelectNative
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value as FilterOptions['dateRange'])}
              >
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </SelectNative>
            </div>
            {filters.dateRange === 'custom' && (
              <>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={filters.startDate || ''} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="date" value={filters.endDate || ''} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {executiveReport && (
        <>
          {/* Executive Summary */}
          <Card>
            <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">Fundraising Pipeline</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-blue-700">Total Targets</span><span className="font-bold text-blue-900">{executiveReport.executive_summary.fundraising_pipeline.total_targets}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-blue-700">High Priority</span><span className="font-bold text-blue-900">{executiveReport.executive_summary.fundraising_pipeline.high_priority}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-blue-700">Active Conversations</span><span className="font-bold text-blue-900">{executiveReport.executive_summary.fundraising_pipeline.active_conversations}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-blue-700">Success Indicators</span><span className="font-bold text-blue-900">{executiveReport.executive_summary.fundraising_pipeline.success_indicators}</span></div>
                  </div>
                </div>

                {/* Business Development */}
                <div className="bg-green-50 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-green-900 mb-3">Business Development</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-green-700">Total Opportunities</span><span className="font-bold text-green-900">{executiveReport.executive_summary.business_development.total_opportunities}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-green-700">Active Pipeline</span><span className="font-bold text-green-900">{executiveReport.executive_summary.business_development.active_pipeline}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-green-700">Conversion Rate</span><span className="font-bold text-green-900">{executiveReport.executive_summary.business_development.conversion_rate}%</span></div>
                  </div>
                </div>

                {/* Operational Efficiency */}
                <div className="bg-purple-50 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-purple-900 mb-3">Operational Efficiency</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-purple-700">Task Completion</span><span className="font-bold text-purple-900">{executiveReport.executive_summary.operational_efficiency.task_completion_rate}%</span></div>
                    <div className="flex justify-between text-sm"><span className="text-purple-700">Network Utilization</span><span className="font-bold text-purple-900">{executiveReport.executive_summary.operational_efficiency.network_utilization}%</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Top Performing Categories</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(executiveReport.key_insights.top_performing_categories)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{category}</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 rounded-full h-1.5 w-16 overflow-hidden">
                            <div className={`bg-blue-600 h-full ${getWidthClass((count / Math.max(...Object.values(executiveReport.key_insights.top_performing_categories))) * 100)}`} />
                          </div>
                          <span className="font-medium text-sm w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Most Effective Referrals</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(executiveReport.key_insights.most_effective_referrals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([referral, count]) => (
                      <div key={referral} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{referral}</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-green-100 rounded-full h-1.5 w-16 overflow-hidden">
                            <div className={`bg-green-600 h-full ${getWidthClass((count / Math.max(...Object.values(executiveReport.key_insights.most_effective_referrals))) * 100)}`} />
                          </div>
                          <span className="font-medium text-sm w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Focus Areas */}
          <Card>
            <CardHeader><CardTitle className="text-base">High Priority Targets</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executiveReport.key_insights.priority_focus_areas.high_priority_targets
                    .filter(target => target.target && target.target.trim())
                    .slice(0, 10)
                    .map((target, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{target.target}</TableCell>
                        <TableCell>{target.category || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="warning">
                            {target.status ? target.status.substring(0, 50) + (target.status.length > 50 ? '...' : '') : 'In Progress'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Report Metadata */}
          <Card className="bg-muted/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Report Generated</p>
                  <p className="text-sm mt-0.5">{format(new Date(executiveReport.report_generated), 'PPpp')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Records</p>
                  <p className="text-sm mt-0.5">
                    {executiveReport.data_freshness.tracker_records + executiveReport.data_freshness.opportunity_records +
                     executiveReport.data_freshness.task_records + executiveReport.data_freshness.contact_records}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;