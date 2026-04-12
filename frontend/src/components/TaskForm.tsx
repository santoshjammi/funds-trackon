import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Task, User, Contact, Opportunity, Fundraising, contactsApi, usersApi, opportunitiesApi, fundraisingApi } from '../services/api';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SelectNative } from './ui/select-native';

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
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="task-title">Task Title *</Label>
        <Input
          id="task-title"
          value={currentTask.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter task title"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="task-type">Task Type</Label>
          <SelectNative id="task-type" value={currentTask.task_type || 'other'} onChange={(e) => handleChange('task_type', e.target.value)}>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
            <option value="email">Email</option>
            <option value="follow_up">Follow Up</option>
            <option value="demo">Demo</option>
            <option value="proposal">Proposal</option>
            <option value="contract">Contract</option>
            <option value="other">Other</option>
          </SelectNative>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-status">Status</Label>
          <SelectNative id="task-status" value={currentTask.status || 'pending'} onChange={(e) => handleChange('status', e.target.value)}>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </SelectNative>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="task-priority">Priority</Label>
          <SelectNative id="task-priority" value={currentTask.priority || 'medium'} onChange={(e) => handleChange('priority', e.target.value)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </SelectNative>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-due-date">Due Date</Label>
          <Input
            id="task-due-date"
            type="datetime-local"
            value={currentTask.due_date ? new Date(currentTask.due_date).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange('due_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-assignee">Assign To</Label>
        <div className="relative">
          <Input
            id="task-assignee"
            ref={assigneeInputRef}
            value={assigneeSearch}
            onChange={handleAssigneeInputChange}
            onFocus={() => setShowAssigneeDropdown(true)}
            onBlur={() => setTimeout(() => setShowAssigneeDropdown(false), 200)}
            onKeyDown={handleAssigneeKeyDown}
            placeholder="Search users or contacts..."
            autoComplete="off"
          />
          {showAssigneeDropdown && filteredAssignees.length > 0 && (
            <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
              {filteredAssignees.slice(0, 20).map((assignee, index) => (
                <button
                  key={assignee.value}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent ${index === selectedAssigneeIndex ? 'bg-accent' : ''}`}
                  onMouseDown={() => handleAssigneeSelect(assignee)}
                >
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${assignee.type === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {assignee.type === 'user' ? 'User' : 'Contact'}
                  </span>
                  <span>{assignee.data.name}</span>
                  <span className="text-muted-foreground text-xs">{assignee.type === 'user' ? assignee.data.email : assignee.data.organisation}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-opportunity">Related Opportunity</Label>
        <SelectNative id="task-opportunity" value={currentTask.opportunity_id || ''} onChange={(e) => handleChange('opportunity_id', e.target.value)}>
          <option value="">None</option>
          {opportunities.map(o => <option key={o.id} value={o.id}>{o.title || o.organisation || o.id}</option>)}
        </SelectNative>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-fundraising">Related Fundraising Campaign</Label>
        <SelectNative id="task-fundraising" value={currentTask.fundraising_id || ''} onChange={(e) => handleChange('fundraising_id', e.target.value)}>
          <option value="">None</option>
          {fundraising.map(f => <option key={f.id} value={f.id}>{f.reference || f.organisation || f.id}</option>)}
        </SelectNative>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-description">Description</Label>
        <Textarea id="task-description" value={currentTask.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={3} placeholder="Describe the task..." />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-notes">Notes</Label>
        <Textarea id="task-notes" value={currentTask.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} rows={2} placeholder="Additional notes..." />
      </div>
    </div>
  );
};

export default TaskForm;

