import React, { useState, useEffect } from 'react';
import { Opportunity, User, Contact, usersApi, contactsApi } from '../services/api';
import UserSearch from './UserSearch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SelectNative } from './ui/select-native';

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

  useEffect(() => {
    if (propUsers.length > 0) setUsers(propUsers);
    if (propContacts.length > 0) setContacts(propContacts);
  }, [propUsers, propContacts]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const promises = [];
        if (users.length === 0) promises.push(usersApi.getAll().then(d => setUsers(d)));
        if (contacts.length === 0) promises.push(contactsApi.getAll().then(d => setContacts(d)));
        await Promise.all(promises);
      } catch (e) {
        console.error('Error loading users/contacts:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentOpportunity = opportunity || {
    title: '', description: '', organisation: '', status: 'Open', priority: 'Medium',
    estimated_value: undefined, probability: undefined, assigned_to: '', contact_id: '',
    target_close_date: '', actual_close_date: '', created_at: '', updated_at: ''
  };

  const handleChange = (field: keyof Opportunity, value: string | number) => {
    onChange({ ...currentOpportunity, [field]: value });
  };

  const getAssignedToDisplay = () => {
    if (currentOpportunity.assigned_to) {
      const user = users.find(u => u.id === currentOpportunity.assigned_to);
      if (user) return `${user.name} (${user.email})`;
    }
    if (currentOpportunity.contact_id) {
      const contact = contacts.find(c => c.id === currentOpportunity.contact_id);
      if (contact) return `${contact.name} (${contact.organisation || 'No Organization'})`;
    }
    return currentOpportunity.assigned_to || '';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Basic Information</h3>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input id="title" value={currentOpportunity.title || ''} onChange={(e) => handleChange('title', e.target.value)} placeholder="Enter opportunity title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org">Organization <span className="text-destructive">*</span></Label>
            <Input id="org" value={currentOpportunity.organisation || ''} onChange={(e) => handleChange('organisation', e.target.value)} placeholder="Enter organization name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <SelectNative id="status" value={currentOpportunity.status || ''} onChange={(e) => handleChange('status', e.target.value)}>
              <option value="">Select status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </SelectNative>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <SelectNative id="priority" value={currentOpportunity.priority || ''} onChange={(e) => handleChange('priority', e.target.value)}>
              <option value="">Select priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </SelectNative>
          </div>
          <div className="space-y-1.5">
            <Label>Assigned To</Label>
            <UserSearch
              users={users} contacts={contacts} value={getAssignedToDisplay()}
              onChange={(value, type, id) => {
                if (type === 'user') onChange({ ...currentOpportunity, assigned_to: id, contact_id: '' });
                else onChange({ ...currentOpportunity, contact_id: id, assigned_to: '' });
              }}
              placeholder="Search and select team member or contact"
              includeContacts={true} loading={loading}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold">Financial Details</h3>
          <div className="space-y-1.5">
            <Label htmlFor="value">Estimated Value</Label>
            <Input id="value" type="number" value={currentOpportunity.estimated_value || ''} onChange={(e) => handleChange('estimated_value', parseFloat(e.target.value) || 0)} placeholder="Enter estimated value" min="0" step="0.01" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prob">Probability (%)</Label>
            <Input id="prob" type="number" value={currentOpportunity.probability || ''} onChange={(e) => handleChange('probability', parseFloat(e.target.value) || 0)} placeholder="Enter probability" min="0" max="100" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tclose">Target Close Date</Label>
            <Input id="tclose" type="date" value={currentOpportunity.target_close_date || ''} onChange={(e) => handleChange('target_close_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aclose">Actual Close Date</Label>
            <Input id="aclose" type="date" value={currentOpportunity.actual_close_date || ''} onChange={(e) => handleChange('actual_close_date', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">Description</Label>
        <Textarea id="desc" value={currentOpportunity.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={4} placeholder="Enter opportunity description" />
      </div>
    </div>
  );
};

export default OpportunityForm;
