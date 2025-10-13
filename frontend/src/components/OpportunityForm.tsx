import React, { useState, useEffect } from 'react';
import { Opportunity, User, Contact, usersApi, contactsApi } from '../services/api';
import UserSearch from './UserSearch';

interface OpportunityFormProps {
  opportunity: Opportunity | null;
  onChange: (opportunity: Opportunity) => void;
  users?: User[];
  contacts?: Contact[];
}

const OpportunityForm: React.FC<OpportunityFormProps> = ({ opportunity, onChange, users: propUsers = [], contacts: propContacts = [] }) => {
  const [users, setUsers] = useState<User[]>(propUsers);
  const [contacts, setContacts] = useState<Contact[]>(propContacts);
  const [loading, setLoading] = useState(true);

  // Update local state when props change
  useEffect(() => {
    if (propUsers.length > 0) {
      setUsers(propUsers);
    }
    if (propContacts.length > 0) {
      setContacts(propContacts);
    }
  }, [propUsers, propContacts]);

  // Load users and contacts if not provided as props
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const promises = [];
        if (users.length === 0) {
          promises.push(usersApi.getAll().then(userData => setUsers(userData)));
        }
        if (contacts.length === 0) {
          promises.push(contactsApi.getAll().then(contactData => setContacts(contactData)));
        }
        await Promise.all(promises);
      } catch (error) {
        console.error('Error loading users/contacts for opportunity form:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Run only once on mount
  // Provide default empty opportunity for creation
  const currentOpportunity = opportunity || {
    title: '',
    description: '',
    organisation: '',
    status: 'Open',
    priority: 'Medium',
    estimated_value: undefined,
    probability: undefined,
    assigned_to: '',
    contact_id: '',
    target_close_date: '',
    actual_close_date: '',
    created_at: '',
    updated_at: ''
  };

  const handleChange = (field: keyof Opportunity, value: string | number) => {
    onChange({
      ...currentOpportunity,
      [field]: value
    });
  };

  // Get display text for assigned_to
  const getAssignedToDisplay = () => {
    if (currentOpportunity.assigned_to) {
      const user = users.find(u => u.id === currentOpportunity.assigned_to);
      if (user) return `${user.name} (${user.email})`;
    }
    if (currentOpportunity.contact_id) {
      const contact = contacts.find(c => c.id === currentOpportunity.contact_id);
      if (contact) return `${contact.name} (${contact.organisation || 'No Organization'})`;
    }
    // If not found, assume it's already a display string (backward compatibility)
    return currentOpportunity.assigned_to || '';
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
                value={currentOpportunity.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter opportunity title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization *
              </label>
              <input
                type="text"
                value={currentOpportunity.organisation || ''}
                onChange={(e) => handleChange('organisation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter organization name"
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={currentOpportunity.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={currentOpportunity.priority || ''}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <UserSearch
                users={users}
                contacts={contacts}
                value={getAssignedToDisplay()}
                onChange={(value, type, id) => {
                  if (type === 'user') {
                    handleChange('assigned_to', id);
                    handleChange('contact_id', '');
                  } else {
                    handleChange('contact_id', id);
                    handleChange('assigned_to', '');
                  }
                }}
                placeholder="Search and select team member or contact"
                includeContacts={true}
                loading={loading}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Value
              </label>
              <input
                type="number"
                value={currentOpportunity.estimated_value || ''}
                onChange={(e) => handleChange('estimated_value', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter estimated value"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Probability (%)
              </label>
              <input
                type="number"
                value={currentOpportunity.probability || ''}
                onChange={(e) => handleChange('probability', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter probability"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Close Date
              </label>
              <input
                type="date"
                value={currentOpportunity.target_close_date || ''}
                onChange={(e) => handleChange('target_close_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Target close date"
                title="Target Close Date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Close Date
              </label>
              <input
                type="date"
                value={currentOpportunity.actual_close_date || ''}
                onChange={(e) => handleChange('actual_close_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter actual close date"
                title="Actual Close Date"
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
          value={currentOpportunity.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter opportunity description"
        />
      </div>
    </div>
  );
};

export default OpportunityForm;