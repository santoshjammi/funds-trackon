import React, { useState, useEffect } from 'react';
import {
  DocumentArrowDownIcon,
  PrinterIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ChartBarIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { analyticsService, ExecutiveReport } from '../services/analyticsApi';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">Generating Report...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-8 w-8 text-red-500 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Error Loading Report</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadExecutiveReport}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Niveshya Reports</h1>
              <p className="text-gray-600 mt-2">Comprehensive analytics and executive insights</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportToPDF}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={exportToExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <TableCellsIcon className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={printReport}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <PrinterIcon className="h-4 w-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Report Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value as FilterOptions['dateRange'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Select date range for the report"
              >
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {filters.dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    title="Select start date for custom range"
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    title="Select end date for custom range"
                    placeholder="Select end date"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {executiveReport && (
          <>
            {/* Executive Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Executive Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Fundraising Pipeline */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Fundraising Pipeline</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Targets</span>
                      <span className="font-bold text-blue-900">{executiveReport.executive_summary.fundraising_pipeline.total_targets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">High Priority</span>
                      <span className="font-bold text-blue-900">{executiveReport.executive_summary.fundraising_pipeline.high_priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Active Conversations</span>
                      <span className="font-bold text-blue-900">{executiveReport.executive_summary.fundraising_pipeline.active_conversations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Success Indicators</span>
                      <span className="font-bold text-blue-900">{executiveReport.executive_summary.fundraising_pipeline.success_indicators}</span>
                    </div>
                  </div>
                </div>

                {/* Business Development */}
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Business Development</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-green-700">Total Opportunities</span>
                      <span className="font-bold text-green-900">{executiveReport.executive_summary.business_development.total_opportunities}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Active Pipeline</span>
                      <span className="font-bold text-green-900">{executiveReport.executive_summary.business_development.active_pipeline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Conversion Rate</span>
                      <span className="font-bold text-green-900">{executiveReport.executive_summary.business_development.conversion_rate}%</span>
                    </div>
                  </div>
                </div>

                {/* Operational Efficiency */}
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4">Operational Efficiency</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-purple-700">Task Completion</span>
                      <span className="font-bold text-purple-900">{executiveReport.executive_summary.operational_efficiency.task_completion_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Network Utilization</span>
                      <span className="font-bold text-purple-900">{executiveReport.executive_summary.operational_efficiency.network_utilization}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Performing Categories */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Categories</h3>
                <div className="space-y-3">
                  {Object.entries(executiveReport.key_insights.top_performing_categories)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-gray-700">{category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="bg-blue-200 rounded-full h-2 w-16 overflow-hidden">
                            <div 
                              className={`bg-blue-600 h-full transition-all duration-300 ${getWidthClass((count / Math.max(...Object.values(executiveReport.key_insights.top_performing_categories))) * 100)}`}
                            ></div>
                          </div>
                          <span className="font-medium text-gray-900 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Most Effective Referrals */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Effective Referrals</h3>
                <div className="space-y-3">
                  {Object.entries(executiveReport.key_insights.most_effective_referrals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([referral, count]) => (
                      <div key={referral} className="flex justify-between items-center">
                        <span className="text-gray-700">{referral}</span>
                        <div className="flex items-center space-x-2">
                                                    <div className="bg-green-200 rounded-full h-2 w-16 overflow-hidden">
                            <div 
                              className={`bg-green-600 h-full transition-all duration-300 ${getWidthClass((count / Math.max(...Object.values(executiveReport.key_insights.most_effective_referrals))) * 100)}`}
                            ></div>
                          </div>
                          <span className="font-medium text-gray-900 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Priority Focus Areas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">High Priority Targets</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {executiveReport.key_insights.priority_focus_areas.high_priority_targets
                      .filter(target => target.target && target.target.trim())
                      .slice(0, 10)
                      .map((target, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {target.target}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {target.category || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {target.status ? target.status.substring(0, 50) + (target.status.length > 50 ? '...' : '') : 'In Progress'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Report Metadata */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Report Generated</h4>
                  <p className="text-sm text-gray-600">{format(new Date(executiveReport.report_generated), 'PPpp')}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-medium text-gray-900">Data Freshness</h4>
                  <p className="text-sm text-gray-600">
                    {executiveReport.data_freshness.tracker_records + executiveReport.data_freshness.opportunity_records + 
                     executiveReport.data_freshness.task_records + executiveReport.data_freshness.contact_records} total records
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;