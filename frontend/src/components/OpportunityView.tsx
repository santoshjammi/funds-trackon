import React from 'react';
import { Opportunity } from '../services/api';

interface OpportunityViewProps {
  opportunity: Opportunity;
}

const OpportunityView: React.FC<OpportunityViewProps> = ({ opportunity }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <p className="text-sm text-gray-900">{opportunity.title || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <p className="text-sm text-gray-900">{opportunity.organisation || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="text-sm text-gray-900">{opportunity.status || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <p className="text-sm text-gray-900">{opportunity.priority || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To</label>
              <p className="text-sm text-gray-900">{opportunity.assigned_to || 'Unassigned'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Estimated Value</label>
              <p className="text-sm text-gray-900">
                {opportunity.estimated_value ? `$${opportunity.estimated_value.toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Probability</label>
              <p className="text-sm text-gray-900">
                {opportunity.probability ? `${opportunity.probability}%` : 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Close Date</label>
              <p className="text-sm text-gray-900">{opportunity.target_close_date || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Actual Close Date</label>
              <p className="text-sm text-gray-900">{opportunity.actual_close_date || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {opportunity.description && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Description</h3>
          <p className="text-sm text-gray-700">{opportunity.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-500">
        <div>
          <span className="font-medium">Created:</span> {opportunity.created_at || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Updated:</span> {opportunity.updated_at || 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default OpportunityView;