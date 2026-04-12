import React from 'react';
import { Opportunity } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface OpportunityViewProps {
  opportunity: Opportunity;
}

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="mt-0.5 text-sm">{value || '—'}</p>
  </div>
);

const OpportunityView: React.FC<OpportunityViewProps> = ({ opportunity }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Title" value={opportunity.title} />
            <Field label="Organization" value={opportunity.organisation} />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <div className="mt-1">
                <Badge variant="secondary">{opportunity.status || '—'}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</p>
              <div className="mt-1">
                <Badge variant={
                  opportunity.priority === 'high' ? 'destructive' :
                  opportunity.priority === 'medium' ? 'warning' : 'secondary'
                }>
                  {opportunity.priority || '—'}
                </Badge>
              </div>
            </div>
            <Field label="Assigned To" value={opportunity.assigned_to || 'Unassigned'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Financial Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="Estimated Value"
              value={opportunity.estimated_value ? `$${opportunity.estimated_value.toLocaleString()}` : undefined}
            />
            <Field
              label="Probability"
              value={opportunity.probability ? `${opportunity.probability}%` : undefined}
            />
            <Field label="Target Close Date" value={opportunity.target_close_date} />
            <Field label="Actual Close Date" value={opportunity.actual_close_date} />
          </CardContent>
        </Card>
      </div>

      {opportunity.description && (
        <Card>
          <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-8 text-sm text-muted-foreground">
        <span><span className="font-medium text-foreground">Created:</span> {opportunity.created_at || '—'}</span>
        <span><span className="font-medium text-foreground">Updated:</span> {opportunity.updated_at || '—'}</span>
      </div>
    </div>
  );
};

export default OpportunityView;
