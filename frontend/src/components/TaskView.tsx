import React from 'react';
import { Task } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface TaskViewProps {
  task: Task;
}

const TaskView: React.FC<TaskViewProps> = ({ task }) => {
  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm">{value || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Title" value={task.title} />
            <Field label="Task Type" value={task.task_type} />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <div className="mt-1"><Badge variant="secondary">{task.status || '—'}</Badge></div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</p>
              <div className="mt-1">
                <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'warning' : 'secondary'}>
                  {task.priority || '—'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Assignment &amp; Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Assigned To" value={task.assigned_to || 'Unassigned'} />
            <Field label="Assigned By" value={task.assigned_by} />
            <Field label="Due Date" value={task.due_date} />
            <Field label="Completed Date" value={task.completed_date} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Related Records</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Contact ID" value={task.contact_id} />
            <Field label="Opportunity ID" value={task.opportunity_id} />
            <Field label="Fundraising ID" value={task.fundraising_id} />
          </CardContent>
        </Card>

        {(task.description || task.notes || (task.tags && task.tags.length > 0)) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Notes &amp; Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {task.description && <Field label="Description" value={task.description} />}
              {task.notes && <Field label="Notes" value={task.notes} />}
              {task.tags && task.tags.length > 0 && <Field label="Tags" value={task.tags.join(', ')} />}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-8 text-sm text-muted-foreground">
        <span><span className="font-medium text-foreground">Created:</span> {task.created_at || '—'}</span>
        <span><span className="font-medium text-foreground">Updated:</span> {task.updated_at || '—'}</span>
      </div>
    </div>
  );
};

export default TaskView;