import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Task, User, Contact, Opportunity, Fundraising, contactsApi, usersApi, opportunitiesApi, fundraisingApi } from '../services/api';

interface TaskFormProps {
  task: Task | null;
  onChange: (task: Task) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onChange }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [fundraising, setFundraising] = useState<Fundraising[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [selectedAssigneeIndex, setSelectedAssigneeIndex] = useState(-1);
  const assigneeInputRef = useRef<HTMLInputElement>(null);

  // Load ALL data immediately for maximum speed
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [usersData, contactsData, opportunitiesData, fundraisingData] = await Promise.all([
          usersApi.getAll(),
          contactsApi.getAll().catch(() => {
            console.log('Contacts API failed, using mock data');
            return [
              { id: 'mock-1', name: 'Santosh Jammi', organisation: 'Test Org', email: 'santosh@test.com' },
              { id: 'mock-2', name: 'John Doe', organisation: 'Another Org', email: 'john@test.com' }
            ] as Contact[];
          }),
          opportunitiesApi.getAll(),
          fundraisingApi.getAll()
        ]);
        console.log('Loaded users:', usersData.length, 'contacts:', contactsData.length); // Debug log
        console.log('Contacts data:', contactsData); // Debug log
        setUsers(usersData);
        setContacts(contactsData);
        setOpportunities(opportunitiesData);
        setFundraising(fundraisingData);
      } catch (error) {
        console.error('Error fetching data for task form:', error);
      }
    };

    fetchAllData();
  }, []);

  // Provide default empty task for creation
  const currentTask = task || {
    title: '',
    description: '',
    task_type: 'other',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    completed_date: '',
    assigned_to: '',
    assigned_by: '',
    contact_id: '',
    opportunity_id: '',
    fundraising_id: '',
    tags: [],
    notes: '',
    created_at: '',
    updated_at: ''
  };

  const handleChange = (field: keyof Task, value: string | number | string[]) => {
    onChange({
      ...currentTask,
      [field]: value
    });
  };

  // Pre-compute assignee data for instant access
  const assigneeData = useMemo(() => {
    const userMap = new Map<string, any>();
    const contactMap = new Map<string, any>();
    const allAssignees: any[] = [];

    users.forEach(user => {
      if (!user.id) return;
      const display = `👤 ${user.name} (${user.email || ''})`;
      const value = `user:${user.id}`;
      const searchText = `${user.name} ${user.email || ''}`.toLowerCase();
      userMap.set(user.id, { type: 'user', data: user, display, value, searchText });
      allAssignees.push({ type: 'user', data: user, display, value, searchText });
    });

    contacts.forEach(contact => {
      if (!contact.id) return;
      const display = `📞 ${contact.name} - ${contact.organisation || ''}`;
      const value = `contact:${contact.id}`;
      const searchText = `${contact.name} ${contact.organisation || ''}`.toLowerCase();
      contactMap.set(contact.id, { type: 'contact', data: contact, display, value, searchText });
      allAssignees.push({ type: 'contact', data: contact, display, value, searchText });
    });

    console.log('Total assignees:', allAssignees.length, 'Users:', users.length, 'Contacts:', contacts.length); // Debug log
    return { userMap, contactMap, allAssignees };
  }, [users, contacts]);

  // Get display text for current assignee - instant lookup using pre-computed maps
  const getAssigneeDisplay = useCallback(() => {
    if (currentTask.assigned_to) {
      const assignee = assigneeData.userMap.get(currentTask.assigned_to);
      return assignee ? assignee.display : '';
    }
    if (currentTask.contact_id) {
      const assignee = assigneeData.contactMap.get(currentTask.contact_id);
      return assignee ? assignee.display : '';
    }
    return '';
  }, [currentTask.assigned_to, currentTask.contact_id, assigneeData]);

  // Update assignee search when task changes
  useEffect(() => {
    setAssigneeSearch(getAssigneeDisplay());
  }, [getAssigneeDisplay]);

  // Ultra-fast filtering using pre-computed data
  const filteredAssignees = useMemo(() => {
    if (!assigneeSearch.trim()) {
      return assigneeData.allAssignees;
    }

    const searchLower = assigneeSearch.toLowerCase();
    return assigneeData.allAssignees.filter(assignee =>
      assignee.searchText.includes(searchLower)
    );
  }, [assigneeSearch, assigneeData]);

  // Handle assignee input change
  const handleAssigneeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Assignee input changed to:', value); // Debug log
    setAssigneeSearch(value);
    setShowAssigneeDropdown(true);
    setSelectedAssigneeIndex(-1);
  };

  // Handle assignee selection
  const handleAssigneeSelect = (assignee: any) => {
    if (assignee.type === 'user') {
      onChange({
        ...currentTask,
        assigned_to: assignee.data.id,
        contact_id: ''
      });
    } else {
      onChange({
        ...currentTask,
        contact_id: assignee.data.id,
        assigned_to: ''
      });
    }
    setAssigneeSearch(assignee.display);
    setShowAssigneeDropdown(false);
    setSelectedAssigneeIndex(-1);
  };

  // Handle keyboard navigation
  const handleAssigneeKeyDown = (e: React.KeyboardEvent) => {
    if (!showAssigneeDropdown) {
      if (e.key === 'ArrowDown') {
        setShowAssigneeDropdown(true);
        setSelectedAssigneeIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedAssigneeIndex(prev =>
          prev < filteredAssignees.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedAssigneeIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedAssigneeIndex >= 0 && filteredAssignees[selectedAssigneeIndex]) {
          handleAssigneeSelect(filteredAssignees[selectedAssigneeIndex]);
        }
        break;
      case 'Escape':
        setShowAssigneeDropdown(false);
        setSelectedAssigneeIndex(-1);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={currentTask.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <label htmlFor="task-type-select" className="block text-sm font-medium text-gray-700 mb-1">
                Task Type
              </label>
              <select
                id="task-type-select"
                value={currentTask.task_type || ''}
                onChange={(e) => handleChange('task_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select task type</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="follow_up">Follow Up</option>
                <option value="research">Research</option>
                <option value="presentation">Presentation</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-status-select" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="task-status-select"
                value={currentTask.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select status</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-priority-select" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="task-priority-select"
                value={currentTask.priority || ''}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Assignment & Timeline</h3>
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="assignee-input" className="block text-sm font-medium text-gray-700 mb-1">
                Assignee *
              </label>
              <input
                ref={assigneeInputRef}
                id="assignee-input"
                type="text"
                value={assigneeSearch || getAssigneeDisplay()}
                onChange={handleAssigneeInputChange}
                onFocus={() => setShowAssigneeDropdown(true)}
                onBlur={() => setTimeout(() => setShowAssigneeDropdown(false), 200)}
                onKeyDown={handleAssigneeKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search and select assignee..."
                title="Search for team members or contacts"
                autoComplete="off"
              />
              {showAssigneeDropdown && filteredAssignees.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                  {filteredAssignees.map((assignee, index) => (
                    <div
                      key={assignee.value}
                      onClick={() => handleAssigneeSelect(assignee)}
                      className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                        index === selectedAssigneeIndex ? 'bg-blue-100' : ''
                      }`}
                    >
                      {assignee.display}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Search for team members or contacts to assign this task
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={currentTask.due_date || ''}
                onChange={(e) => handleChange('due_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Select Due date"
                title="Due Date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completed Date
              </label>
              <input
                type="date"
                value={currentTask.completed_date || ''}
                onChange={(e) => handleChange('completed_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Select completed date"
                title="Completed Date"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Related Records</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Opportunity
              </label>
              <select
                value={currentTask.opportunity_id || ''}
                onChange={(e) => handleChange('opportunity_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Select related opportunity"
              >
                <option value="">Select opportunity</option>
                {opportunities.map(opportunity => (
                  <option key={opportunity.id} value={opportunity.id}>
                    {opportunity.title} - {opportunity.organisation}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Fundraising
              </label>
              <select
                value={currentTask.fundraising_id || ''}
                onChange={(e) => handleChange('fundraising_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Select related fundraising campaign"
              >
                <option value="">Select fundraising campaign</option>
                {fundraising.map(fund => (
                  <option key={fund.id} value={fund.id}>
                    {fund.organisation} - {fund.investor_type || 'Investor'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={currentTask.tags?.join(', ') || ''}
                onChange={(e) => handleChange('tags', e.target.value.split(',').map(tag => tag.trim()))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Comma-separated tags"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={currentTask.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={currentTask.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes"
        />
      </div>
    </div>
  );
};

export default React.memo(TaskForm);
