import React from 'react';
import { Task } from '../services/api';

interface TaskViewProps {
  task: Task;
}

const TaskView: React.FC<TaskViewProps> = ({ task }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <p className="text-sm text-gray-900">{task.title || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Task Type</label>
              <p className="text-sm text-gray-900">{task.task_type || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="text-sm text-gray-900">{task.status || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <p className="text-sm text-gray-900">{task.priority || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Assignment & Timeline</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To</label>
              <p className="text-sm text-gray-900">{task.assigned_to || 'Unassigned'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned By</label>
              <p className="text-sm text-gray-900">{task.assigned_by || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <p className="text-sm text-gray-900">{task.due_date || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Completed Date</label>
              <p className="text-sm text-gray-900">{task.completed_date || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Related Records</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact ID</label>
              <p className="text-sm text-gray-900">{task.contact_id || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Opportunity ID</label>
              <p className="text-sm text-gray-900">{task.opportunity_id || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fundraising ID</label>
              <p className="text-sm text-gray-900">{task.fundraising_id || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <p className="text-sm text-gray-900">{task.tags?.join(', ') || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {task.description && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Description</h3>
          <p className="text-sm text-gray-700">{task.description}</p>
        </div>
      )}

      {task.notes && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Notes</h3>
          <p className="text-sm text-gray-700">{task.notes}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-500">
        <div>
          <span className="font-medium">Created:</span> {task.created_at || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Updated:</span> {task.updated_at || 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default TaskView;