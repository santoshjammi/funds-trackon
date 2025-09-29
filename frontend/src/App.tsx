import React, { useState, useEffect } from 'react';
import { contactsApi, fundraisingApi, usersApi, organizationsApi, healthCheck, Contact, Fundraising, User, Organization } from './services/api';

function App() {
  const [activeView, setActiveView] = useState<'contacts' | 'contact-detail' | 'organizations' | 'organization-detail' | 'fundraising' | 'fundraising-detail' | 'users' | 'user-detail'>('organizations');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fundraising, setFundraising] = useState<Fundraising[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  // Contact detail state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Contact | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  
  // Organization detail state
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isOrgEditMode, setIsOrgEditMode] = useState<boolean>(false);
  const [orgEditFormData, setOrgEditFormData] = useState<Organization | null>(null);
  const [showOrgDeleteConfirm, setShowOrgDeleteConfirm] = useState<boolean>(false);
  
  // User detail state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserEditMode, setIsUserEditMode] = useState<boolean>(false);
  const [userEditFormData, setUserEditFormData] = useState<User | null>(null);
  const [showUserDeleteConfirm, setShowUserDeleteConfirm] = useState<boolean>(false);
  
  // Search and sort state for contacts
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof Contact | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Search and sort state for organizations
  const [orgSearchTerm, setOrgSearchTerm] = useState<string>('');
  const [orgSortField, setOrgSortField] = useState<keyof Organization | ''>('');
  const [orgSortDirection, setOrgSortDirection] = useState<'asc' | 'desc'>('asc');

  // Search and sort state for users
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [userSortField, setUserSortField] = useState<keyof User | ''>('');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');

  // Search and sort state for fundraising
  const [fundraisingSearchTerm, setFundraisingSearchTerm] = useState<string>('');
  const [fundraisingSortField, setFundraisingSortField] = useState<keyof Fundraising | ''>('');
  const [fundraisingSortDirection, setFundraisingSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fundraising detail states
  const [selectedFundraising, setSelectedFundraising] = useState<Fundraising | null>(null);
  const [fundraisingEditFormData, setFundraisingEditFormData] = useState<Fundraising | null>(null);
  const [isFundraisingEditMode, setIsFundraisingEditMode] = useState(false);
  const [showFundraisingDeleteConfirm, setShowFundraisingDeleteConfirm] = useState(false);

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await healthCheck();
        setBackendStatus('connected');
      } catch (err) {
        setBackendStatus('error');
        setError('Backend connection failed. Make sure the server is running on http://localhost:8000');
      }
    };
    checkBackend();
  }, []);

  // Fetch data based on active view
  useEffect(() => {
    if (backendStatus !== 'connected') return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        switch (activeView) {
          case 'contacts':
            const contactData = await contactsApi.getAll();
            setContacts(contactData);
            break;
          case 'organizations':
            const organizationData = await organizationsApi.getAll();
            setOrganizations(organizationData);
            break;
          case 'fundraising':
            const fundraisingData = await fundraisingApi.getAll();
            setFundraising(fundraisingData);
            break;
          case 'users':
            const userData = await usersApi.getAll();
            setUsers(userData);
            break;
        }
      } catch (err) {
        setError(`Failed to fetch ${activeView} data. Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data for views that need it (not detail views which have their own data)
    if (['contacts', 'organizations', 'fundraising', 'users'].includes(activeView)) {
      fetchData();
    }
  }, [activeView, backendStatus]);

  const renderBackendStatus = () => {
    switch (backendStatus) {
      case 'checking':
        return (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            🔄 Checking backend connection...
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            ❌ Backend connection failed. Make sure your FastAPI server is running on http://localhost:8000
            <br />
            <small>Run: <code>cd backend && python main_simple.py</code></small>
          </div>
        );
      case 'connected':
        return (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            ✅ Connected to backend successfully
          </div>
        );
    }
  };

  const renderNavigationBar = () => (
    <nav className="bg-white shadow-lg mb-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-center space-x-8">
          <button
            onClick={() => setActiveView('organizations')}
            className={`py-4 px-6 font-medium transition-colors border-b-2 ${
              activeView.startsWith('organization') 
                ? 'border-purple-500 text-purple-600 bg-purple-50' 
                : 'border-transparent text-gray-600 hover:text-purple-600 hover:border-purple-300'
            }`}
          >
            📊 Organizations
          </button>
          <button
            onClick={() => setActiveView('contacts')}
            className={`py-4 px-6 font-medium transition-colors border-b-2 ${
              activeView.startsWith('contact') 
                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300'
            }`}
          >
            👥 Contacts
          </button>
          <button
            onClick={() => setActiveView('fundraising')}
            className={`py-4 px-6 font-medium transition-colors border-b-2 ${
              activeView === 'fundraising' 
                ? 'border-green-500 text-green-600 bg-green-50' 
                : 'border-transparent text-gray-600 hover:text-green-600 hover:border-green-300'
            }`}
          >
            💰 Fundraising Campaigns
          </button>
          <button
            onClick={() => setActiveView('users')}
            className={`py-4 px-6 font-medium transition-colors border-b-2 ${
              activeView === 'users' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                : 'border-transparent text-gray-600 hover:text-indigo-600 hover:border-indigo-300'
            }`}
          >
            🏢 Team Members
          </button>
        </div>
      </div>
    </nav>
  );

  // Helper functions for search and sort
  const filterContacts = (contacts: Contact[]) => {
    if (!searchTerm) return contacts;
    
    return contacts.filter(contact =>
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.organisation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.branch_department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.geography_region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.country_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.notes_comments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const sortContacts = (contacts: Contact[]) => {
    if (!sortField) return contacts;
    
    return [...contacts].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  };

  const handleSort = (field: keyof Contact) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get filtered and sorted contacts
  const getProcessedContacts = () => {
    const filtered = filterContacts(contacts);
    return sortContacts(filtered);
  };

  // Handle contact selection for detail view
  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setEditFormData(contact); // Initialize form data
    setIsEditMode(false); // Start in view mode
    setActiveView('contact-detail');
  };

  const handleBackToContacts = () => {
    setSelectedContact(null);
    setEditFormData(null);
    setIsEditMode(false);
    setShowDeleteConfirm(false);
    setActiveView('contacts');
  };

  const handleEditContact = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditFormData(selectedContact); // Reset to original data
    setIsEditMode(false);
  };

  const handleSaveContact = async () => {
    if (!editFormData || !editFormData.id) return;
    
    try {
      setLoading(true);
      await contactsApi.update(editFormData.id, editFormData);
      
      // Update the selected contact and contacts list
      setSelectedContact(editFormData);
      setContacts(contacts.map(c => c.id === editFormData.id ? editFormData : c));
      setIsEditMode(false);
      setError(null);
    } catch (err) {
      setError('Failed to update contact. Please try again.');
      console.error('Error updating contact:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact || !selectedContact.id) return;
    
    try {
      setLoading(true);
      await contactsApi.delete(selectedContact.id);
      
      // Remove from contacts list and go back to contacts view
      setContacts(contacts.filter(c => c.id !== selectedContact.id));
      setError(null);
      handleBackToContacts();
    } catch (err) {
      setError('Failed to delete contact. Please try again.');
      console.error('Error deleting contact:', err);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleFormChange = (field: keyof Contact, value: string) => {
    if (!editFormData) return;
    
    setEditFormData({
      ...editFormData,
      [field]: value
    });
  };

  // User detail handlers
  const handleBackToUsers = () => {
    setSelectedUser(null);
    setIsUserEditMode(false);
    setUserEditFormData(null);
    setShowUserDeleteConfirm(false);
    setActiveView('users');
  };

  const handleEditUser = () => {
    setUserEditFormData(selectedUser);
    setIsUserEditMode(true);
  };

  const handleCancelUserEdit = () => {
    setUserEditFormData(selectedUser); // Reset to original data
    setIsUserEditMode(false);
  };

  const handleSaveUser = async () => {
    if (!userEditFormData || !userEditFormData.id) return;
    
    try {
      setLoading(true);
      await usersApi.update(userEditFormData.id, userEditFormData);
      
      // Update the selected user and users list
      setSelectedUser(userEditFormData);
      setUsers(users.map(u => u.id === userEditFormData.id ? userEditFormData : u));
      setIsUserEditMode(false);
      setError(null);
    } catch (err) {
      setError('Failed to update user. Please try again.');
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !selectedUser.id) return;
    
    try {
      setLoading(true);
      await usersApi.delete(selectedUser.id);
      
      // Remove from users list and go back to users view
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setError(null);
      handleBackToUsers();
    } catch (err) {
      setError('Failed to delete user. Please try again.');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
      setShowUserDeleteConfirm(false);
    }
  };

  const handleUserFormChange = (field: keyof User, value: string) => {
    if (!userEditFormData) return;
    
    setUserEditFormData({
      ...userEditFormData,
      [field]: value
    });
  };

  // Helper function to render editable field
  const renderEditableField = (
    label: string, 
    field: keyof Contact, 
    type: 'text' | 'email' | 'tel' = 'text',
    icon?: string
  ) => {
    const value = editFormData?.[field] as string || '';
    
    return (
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="flex-shrink-0">
            <span className="inline-block w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
              {icon}
            </span>
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          {isEditMode ? (
            <input
              type={type}
              value={value}
              onChange={(e) => handleFormChange(field, e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          ) : (
            <div className="mt-1">
              {value ? (
                type === 'email' ? (
                  <a href={`mailto:${value}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                    {value}
                  </a>
                ) : type === 'tel' ? (
                  <a href={`tel:${value}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                    {value}
                  </a>
                ) : (
                  <p className="text-gray-900">{value}</p>
                )
              ) : (
                <p className="text-gray-400 italic">Not provided</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContactDetail = () => {
    if (!selectedContact) return null;
    
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Contact Details</h2>
          <div className="flex space-x-3">
            {!isEditMode ? (
              <>
                <button 
                  onClick={handleEditContact}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  🗑️ Delete
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleSaveContact}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : '💾 Save'}
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  ❌ Cancel
                </button>
              </>
            )}
            <button 
              onClick={handleBackToContacts}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to Contacts
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header with contact name and organization */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-8 rounded-t-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {selectedContact.name?.charAt(0) || 'C'}
                  </span>
                </div>
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold">{selectedContact.name}</h1>
                <p className="text-xl opacity-90">{selectedContact.organisation}</p>
                {selectedContact.designation && (
                  <p className="text-lg opacity-75">{selectedContact.designation}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Contact Information Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                
                {/* Name (always visible) */}
                {renderEditableField('Name', 'name', 'text', '👤')}
                
                {/* Email */}
                {renderEditableField('Email', 'email', 'email', '�')}
                
                {/* Phone */}
                {renderEditableField('Phone', 'phone', 'tel', '📞')}
                
                {/* Mobile */}
                {renderEditableField('Mobile', 'mobile', 'tel', '📱')}
                
                {/* Address */}
                {renderEditableField('Address', 'address', 'text', '🏢')}
              </div>
              
              {/* Organization & Location Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Organization Details</h3>
                
                {/* Organization */}
                {renderEditableField('Organization', 'organisation', 'text', '🏢')}
                
                {/* Designation */}
                {renderEditableField('Designation', 'designation', 'text', '💼')}
                
                {/* Department */}
                {renderEditableField('Department', 'branch_department', 'text', '🏛️')}
                
                {/* Region */}
                {renderEditableField('Region', 'geography_region', 'text', '🌍')}
                
                {/* Country/Location */}
                {renderEditableField('Country/Location', 'country_location', 'text', '📍')}
                
                {/* Sub Location */}
                {renderEditableField('Sub Location', 'sub_location', 'text', '📌')}
                
                {/* Status */}
                {renderEditableField('Status', 'status', 'text', '✅')}
              </div>
            </div>
            
            {/* Notes Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Notes & Comments</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {isEditMode ? (
                  <textarea
                    value={editFormData?.notes_comments || ''}
                    onChange={(e) => handleFormChange('notes_comments', e.target.value)}
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notes and comments..."
                  />
                ) : (
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedContact.notes_comments || 'No notes available'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Timestamps */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  Created: {selectedContact.created_at ? new Date(selectedContact.created_at).toLocaleString() : 'N/A'}
                </span>
                <span>
                  Updated: {selectedContact.updated_at ? new Date(selectedContact.updated_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">Delete Contact</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{selectedContact.name}</strong>? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center space-x-3 px-4 py-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteContact}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrganizationDetail = () => {
    if (!selectedOrganization) return null;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedOrganization.name}</h2>
              <p className="text-gray-600 mt-1">{selectedOrganization.industry || 'Industry not specified'}</p>
            </div>
            <div className="flex space-x-3">
              {!isOrgEditMode ? (
                <>
                  <button 
                    onClick={handleEditOrganization}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => setShowOrgDeleteConfirm(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleSaveOrganization}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={handleCancelOrgEdit}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button 
                onClick={handleBackToOrganizations}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                ← Back to Organizations
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              
              {renderOrgEditableField('Organization Name', 'name', 'text', '🏢')}
              {renderOrgEditableField('Industry', 'industry', 'text', '🏭')}
              {renderOrgEditableField('Type', 'organization_type', 'text', '📊')}
              {renderOrgEditableField('Description', 'description', 'text', '📝')}
              {renderOrgEditableField('Website', 'website', 'url', '🌐')}
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
              
              {renderOrgEditableField('Contact Person', 'contact_person', 'text', '👤')}
              {renderOrgEditableField('Designation', 'contact_designation', 'text', '🎯')}
              {renderOrgEditableField('Email', 'email', 'email', '📧')}
              {renderOrgEditableField('Phone', 'phone', 'tel', '📞')}
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location</h3>
              
              {renderOrgEditableField('Address', 'address', 'text', '📍')}
              {renderOrgEditableField('City', 'city', 'text', '🏙️')}
              {renderOrgEditableField('State', 'state', 'text', '🗺️')}
              {renderOrgEditableField('Country', 'country', 'text', '🌍')}
              {renderOrgEditableField('Postal Code', 'postal_code', 'text', '📮')}
              {renderOrgEditableField('Region', 'geography_region', 'text', '🌏')}
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Information</h3>
              
              {renderOrgEditableField('Annual Revenue (Cr)', 'annual_revenue', 'number', '💰')}
              {renderOrgEditableField('Employee Count', 'employee_count', 'number', '👥')}
              {renderOrgEditableField('Founded Year', 'founded_year', 'number', '📅')}
              {renderOrgEditableField('Investment Stage', 'investment_stage', 'text', '📈')}
              {renderOrgEditableField('Previous Funding (Cr)', 'previous_funding', 'number', '💵')}
            </div>

            {/* Relationship Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Relationship Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderOrgEditableField('Relationship Status', 'relationship_status', 'text', '🤝')}
                {renderOrgEditableField('Last Contact Date', 'last_contact_date', 'text', '📅')}
                {renderOrgEditableField('Next Action', 'next_action', 'text', '⚡')}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Notes</h3>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="inline-block w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
                    📝
                  </span>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-600">Notes:</span>
                  {isOrgEditMode ? (
                    <textarea
                      value={orgEditFormData?.notes || ''}
                      onChange={(e) => handleOrgFormChange('notes', e.target.value)}
                      rows={4}
                      placeholder="Add notes about this organization..."
                      aria-label="Organization notes"
                      className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="ml-2 text-gray-900 whitespace-pre-wrap">
                      {selectedOrganization.notes || 'No notes available'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                Created: {selectedOrganization.created_at ? new Date(selectedOrganization.created_at).toLocaleString() : 'N/A'}
              </span>
              <span>
                Updated: {selectedOrganization.updated_at ? new Date(selectedOrganization.updated_at).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showOrgDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">Delete Organization</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{selectedOrganization.name}</strong>? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center space-x-3 px-4 py-3">
                  <button
                    onClick={() => setShowOrgDeleteConfirm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteOrganization}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Organization helper functions for search and sort
  const filterOrganizations = (organizations: Organization[]) => {
    if (!orgSearchTerm) return organizations;
    
    return organizations.filter(org =>
      org.name?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.industry?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.organization_type?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.description?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.contact_person?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.contact_designation?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.email?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.phone?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.city?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.country?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.geography_region?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.investment_stage?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.relationship_status?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.notes?.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.status?.toLowerCase().includes(orgSearchTerm.toLowerCase())
    );
  };

  const sortOrganizations = (organizations: Organization[]) => {
    if (!orgSortField) return organizations;
    
    return [...organizations].sort((a, b) => {
      const aValue = a[orgSortField] || '';
      const bValue = b[orgSortField] || '';
      
      if (orgSortDirection === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  };

  const handleOrgSort = (field: keyof Organization) => {
    if (orgSortField === field) {
      setOrgSortDirection(orgSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrgSortField(field);
      setOrgSortDirection('asc');
    }
  };

  // Get filtered and sorted organizations
  const getProcessedOrganizations = () => {
    const filtered = filterOrganizations(organizations);
    return sortOrganizations(filtered);
  };

  // User filtering and sorting functions
  const filterUsers = (users: User[]) => {
    if (!userSearchTerm) return users;
    
    return users.filter(user =>
      user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.organisation?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.designation?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.roles?.some(role => role.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      user.notes?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (user.is_active ? 'active' : 'inactive').includes(userSearchTerm.toLowerCase())
    );
  };

  const sortUsers = (users: User[]) => {
    if (!userSortField) return users;
    
    return [...users].sort((a, b) => {
      let aValue: any = a[userSortField];
      let bValue: any = b[userSortField];
      
      // Handle specific field cases
      if (userSortField === 'name') {
        // For name column, prioritize username or fallback to name
        aValue = a.username || a.name || '';
        bValue = b.username || b.name || '';
      } else if (userSortField === 'roles') {
        // Handle array fields like roles
        aValue = Array.isArray(aValue) ? aValue.join(', ') : '';
        bValue = Array.isArray(bValue) ? bValue.join(', ') : '';
      } else if (userSortField === 'is_active') {
        // Handle boolean fields (active users first when ascending)
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
        
        if (userSortDirection === 'asc') {
          return bValue - aValue; // Active first
        } else {
          return aValue - bValue; // Inactive first
        }
      } else if (userSortField === 'created_at' || userSortField === 'updated_at' || userSortField === 'last_login') {
        // Handle date fields
        const aDate = aValue ? new Date(aValue).getTime() : 0;
        const bDate = bValue ? new Date(bValue).getTime() : 0;
        
        if (userSortDirection === 'asc') {
          return aDate - bDate;
        } else {
          return bDate - aDate;
        }
      } else {
        // Handle null/undefined values
        aValue = aValue || '';
        bValue = bValue || '';
      }
      
      // Convert to strings for comparison (for non-numeric/date fields)
      const aStr = aValue.toString().toLowerCase();
      const bStr = bValue.toString().toLowerCase();
      
      if (userSortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  };

  const handleUserSort = (field: keyof User) => {
    if (userSortField === field) {
      setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortDirection('asc');
    }
  };

  // Get filtered and sorted users
  const getProcessedUsers = () => {
    const filtered = filterUsers(users);
    return sortUsers(filtered);
  };

  // Fundraising filtering and sorting functions
  const filterFundraising = (fundraising: Fundraising[]) => {
    if (!fundraisingSearchTerm) return fundraising;
    
    return fundraising.filter(campaign =>
      campaign.organisation?.toLowerCase().includes(fundraisingSearchTerm.toLowerCase()) ||
      campaign.reference?.toLowerCase().includes(fundraisingSearchTerm.toLowerCase()) ||
      campaign.investor_type?.toLowerCase().includes(fundraisingSearchTerm.toLowerCase()) ||
      campaign.responsibility_tnifmc?.toLowerCase().includes(fundraisingSearchTerm.toLowerCase()) ||
      campaign.current_status?.toLowerCase().includes(fundraisingSearchTerm.toLowerCase()) ||
      campaign.status_open_closed?.toLowerCase().includes(fundraisingSearchTerm.toLowerCase()) ||
      campaign.notes?.toLowerCase().includes(fundraisingSearchTerm.toLowerCase())
    );
  };

  const sortFundraising = (fundraising: Fundraising[]) => {
    if (!fundraisingSortField) return fundraising;
    
    return [...fundraising].sort((a, b) => {
      const aValue = a[fundraisingSortField] || '';
      const bValue = b[fundraisingSortField] || '';
      
      if (fundraisingSortDirection === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  };

  const handleFundraisingSort = (field: keyof Fundraising) => {
    if (fundraisingSortField === field) {
      setFundraisingSortDirection(fundraisingSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setFundraisingSortField(field);
      setFundraisingSortDirection('asc');
    }
  };

  // Get filtered and sorted fundraising campaigns
  const getProcessedFundraising = () => {
    const filtered = filterFundraising(fundraising);
    return sortFundraising(filtered);
  };

  // Handle organization selection for detail view
  const handleOrganizationClick = (organization: Organization) => {
    setSelectedOrganization(organization);
    setOrgEditFormData(organization); // Initialize form data
    setIsOrgEditMode(false); // Start in view mode
    setActiveView('organization-detail');
  };

  const handleBackToOrganizations = () => {
    setSelectedOrganization(null);
    setOrgEditFormData(null);
    setIsOrgEditMode(false);
    setShowOrgDeleteConfirm(false);
    setActiveView('organizations');
  };

  const handleEditOrganization = () => {
    setIsOrgEditMode(true);
  };

  const handleCancelOrgEdit = () => {
    setOrgEditFormData(selectedOrganization); // Reset to original data
    setIsOrgEditMode(false);
  };

  const handleSaveOrganization = async () => {
    if (!orgEditFormData || !orgEditFormData.id) return;
    
    try {
      setLoading(true);
      await organizationsApi.update(orgEditFormData.id, orgEditFormData);
      
      // Update the selected organization and organizations list
      setSelectedOrganization(orgEditFormData);
      setOrganizations(organizations.map(o => o.id === orgEditFormData.id ? orgEditFormData : o));
      setIsOrgEditMode(false);
      setError(null);
    } catch (err) {
      setError('Failed to update organization. Please try again.');
      console.error('Error updating organization:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrganization || !selectedOrganization.id) return;
    
    try {
      setLoading(true);
      await organizationsApi.delete(selectedOrganization.id);
      
      // Remove from organizations list and go back to organizations view
      setOrganizations(organizations.filter(o => o.id !== selectedOrganization.id));
      setError(null);
      handleBackToOrganizations();
    } catch (err) {
      setError('Failed to delete organization. Please try again.');
      console.error('Error deleting organization:', err);
    } finally {
      setLoading(false);
      setShowOrgDeleteConfirm(false);
    }
  };

  const handleOrgFormChange = (field: keyof Organization, value: string | number) => {
    if (!orgEditFormData) return;
    
    setOrgEditFormData({
      ...orgEditFormData,
      [field]: value
    });
  };

  // Helper function to render editable organization field
  const renderOrgEditableField = (
    label: string, 
    field: keyof Organization, 
    type: 'text' | 'email' | 'tel' | 'number' | 'url' = 'text',
    icon?: string
  ) => {
    const value = orgEditFormData?.[field] as string | number || '';
    
    return (
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="flex-shrink-0">
            <span className="inline-block w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
              {icon}
            </span>
          </div>
        )}
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-600">{label}:</span>
          {isOrgEditMode ? (
            <input
              type={type}
              value={value}
              onChange={(e) => handleOrgFormChange(field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
              aria-label={label}
              className="ml-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <span className="ml-2 text-gray-900">
              {value || 'Not specified'}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderContacts = () => {
    const processedContacts = getProcessedContacts();
    
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Contacts ({processedContacts.length}{contacts.length !== processedContacts.length ? ` of ${contacts.length}` : ''})
          </h2>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search contacts by name, organization, email, position, department, region, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading contacts...</p>
        </div>
        ) : contacts.length === 0 ? (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">No contacts found. Add some sample data to see it here!</p>
          </div>
        ) : processedContacts.length === 0 ? (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">No contacts match your search criteria.</p>
          </div>
        ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                    >
                      <span>Name</span>
                      {sortField === 'name' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('organisation')}
                      className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                    >
                      <span>Organization</span>
                      {sortField === 'organisation' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('designation')}
                      className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                    >
                      <span>Designation</span>
                      {sortField === 'designation' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('branch_department')}
                      className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                    >
                      <span>Department</span>
                      {sortField === 'branch_department' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('geography_region')}
                      className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                    >
                      <span>Region</span>
                      {sortField === 'geography_region' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                    >
                      <span>Status</span>
                      {sortField === 'status' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedContacts.map((contact, index) => (
                  <tr key={contact.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleContactClick(contact)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      >
                        {contact.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contact.organisation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{contact.designation || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.email && (
                          <div className="flex items-center">
                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                            <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-800">
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center mt-1">
                            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                            <a href={`tel:${contact.phone}`} className="text-gray-600 hover:text-gray-800">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                        {contact.mobile && (
                          <div className="flex items-center mt-1">
                            <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                            <a href={`tel:${contact.mobile}`} className="text-gray-600 hover:text-gray-800">
                              📱 {contact.mobile}
                            </a>
                          </div>
                        )}
                        {!contact.email && !contact.phone && !contact.mobile && (
                          <span className="text-gray-400">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{contact.branch_department || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{contact.geography_region || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate" title={contact.notes_comments || ''}>
                        {contact.notes_comments || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contact.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Showing {processedContacts.length} contacts{contacts.length !== processedContacts.length ? ` (filtered from ${contacts.length})` : ''}</span>
              <div className="flex space-x-4">
                <span>📧 Email: {processedContacts.filter(c => c.email).length}</span>
                <span>📞 Phone: {processedContacts.filter(c => c.phone).length}</span>
                <span>📱 Mobile: {processedContacts.filter(c => c.mobile).length}</span>
                <span>🏢 Dept: {processedContacts.filter(c => c.branch_department).length}</span>
                <span>📝 Notes: {processedContacts.filter(c => c.notes_comments).length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  const renderUserDetail = () => {
    if (!selectedUser) return null;
    
    const renderUserEditableField = (
      label: string, 
      field: keyof User, 
      type: 'text' | 'email' | 'tel' = 'text',
      icon?: string
    ) => {
      const value = userEditFormData?.[field] as string || '';
      
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="inline-block w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
              {icon || '📝'}
            </span>
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-600">{label}:</span>
            {isUserEditMode ? (
              <input
                type={type}
                value={value}
                onChange={(e) => handleUserFormChange(field, e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}`}
                aria-label={label}
                className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <p className="ml-2 text-gray-900">
                {value || 'Not provided'}
              </p>
            )}
          </div>
        </div>
      );
    };
    
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <div className="flex space-x-3">
            {!isUserEditMode ? (
              <>
                <button 
                  onClick={handleEditUser}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={() => setShowUserDeleteConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  🗑️ Delete
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleSaveUser}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : '💾 Save'}
                </button>
                <button 
                  onClick={handleCancelUserEdit}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  ❌ Cancel
                </button>
              </>
            )}
            <button 
              onClick={handleBackToUsers}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to Users
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header with user name and organization */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-8 rounded-t-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {selectedUser.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold">{selectedUser.name}</h1>
                <p className="text-xl opacity-90">{selectedUser.organisation}</p>
                {selectedUser.designation && (
                  <p className="text-lg opacity-75">{selectedUser.designation}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* User Information Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                
                {renderUserEditableField('Name', 'name', 'text', '👤')}
                {renderUserEditableField('Email', 'email', 'email', '📧')}
                {renderUserEditableField('Phone', 'phone', 'tel', '📞')}
                {renderUserEditableField('Username', 'username', 'text', '🆔')}
              </div>
              
              {/* Professional Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Information</h3>
                
                {renderUserEditableField('Organisation', 'organisation', 'text', '🏢')}
                {renderUserEditableField('Designation', 'designation', 'text', '💼')}
                
                {/* Employment Type */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-block w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
                      👔
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-600">Employment Type:</span>
                    {isUserEditMode ? (
                      <select
                        value={userEditFormData?.employment_type || ''}
                        onChange={(e) => handleUserFormChange('employment_type', e.target.value)}
                        aria-label="Employment Type"
                        className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Employment Type</option>
                        <option value="Employee">Employee</option>
                        <option value="Contractor">Contractor</option>
                        <option value="Consultant">Consultant</option>
                      </select>
                    ) : (
                      <p className="ml-2 text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedUser.employment_type === 'Employee' 
                            ? 'bg-green-100 text-green-800'
                            : selectedUser.employment_type === 'Contractor'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedUser.employment_type === 'Consultant'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedUser.employment_type || 'Not specified'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                
                {/* User Status */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-block w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
                      {selectedUser.is_active ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <p className="ml-2 text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* User Roles */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-block w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
                      👑
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-600">Roles:</span>
                    <div className="ml-2 mt-1">
                      {selectedUser.roles?.map((role, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mr-2 mb-1">
                          {role}
                        </span>
                      )) || <span className="text-gray-500">No roles assigned</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Notes</h3>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="inline-block w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
                    📝
                  </span>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-600">Notes:</span>
                  {isUserEditMode ? (
                    <textarea
                      value={userEditFormData?.notes || ''}
                      onChange={(e) => handleUserFormChange('notes', e.target.value)}
                      rows={4}
                      placeholder="Add notes about this user..."
                      aria-label="User notes"
                      className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="ml-2 text-gray-900 whitespace-pre-wrap">
                      {selectedUser.notes || 'No notes available'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-8 pt-6 border-t border-gray-200 px-6 pb-6">
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                Created: {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}
              </span>
              <span>
                Updated: {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showUserDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">Delete User</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete "{selectedUser.name}"? This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUserDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrganizations = () => {
    const processedOrganizations = getProcessedOrganizations();
    
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Organizations ({organizations.length})</h2>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              value={orgSearchTerm}
              onChange={(e) => setOrgSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Search organizations by name, industry, contact person, location..."
            />
          </div>
        </div>

        {loading && <p className="text-center text-gray-600">Loading organizations...</p>}
        
        {!loading && processedOrganizations.length === 0 && (
          <div className="text-center text-gray-600">
            {orgSearchTerm ? 'No organizations found matching your search.' : 'No organizations available.'}
          </div>
        )}

        {!loading && processedOrganizations.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th onClick={() => handleOrgSort('name')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Name {orgSortField === 'name' && (orgSortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleOrgSort('industry')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Industry {orgSortField === 'industry' && (orgSortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleOrgSort('contact_person')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Contact Person {orgSortField === 'contact_person' && (orgSortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleOrgSort('city')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Location {orgSortField === 'city' && (orgSortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleOrgSort('relationship_status')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Status {orgSortField === 'relationship_status' && (orgSortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => handleOrganizationClick(org)}
                          className="text-left hover:text-purple-600 transition-colors"
                        >
                          <div className="text-sm font-medium text-purple-600 hover:text-purple-900 cursor-pointer">{org.name}</div>
                          <div className="text-sm text-gray-500">{org.organization_type || 'N/A'}</div>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{org.industry || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{org.contact_person || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{org.contact_designation || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{org.city || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{org.country || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          org.relationship_status === 'active' ? 'bg-green-100 text-green-800' :
                          org.relationship_status === 'prospect' ? 'bg-blue-100 text-blue-800' :
                          org.relationship_status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {org.relationship_status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFundraising = () => {
    const processedFundraising = getProcessedFundraising();
    
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Fundraising Campaigns ({processedFundraising.length}{fundraising.length !== processedFundraising.length ? ` of ${fundraising.length}` : ''})
          </h2>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search fundraising by organization, reference, investor type, status, notes..."
              value={fundraisingSearchTerm}
              onChange={(e) => setFundraisingSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
            {fundraisingSearchTerm && (
              <button
                onClick={() => setFundraisingSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading fundraising data...</p>
        </div>
      ) : processedFundraising.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {fundraisingSearchTerm ? 'No fundraising campaigns match your search criteria.' : 'No fundraising data found. Add some sample data to see it here!'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleFundraisingSort('organisation')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Organization</span>
                      {fundraisingSortField === 'organisation' && (
                        <svg className={`w-4 h-4 ${fundraisingSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleFundraisingSort('status_open_closed')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {fundraisingSortField === 'status_open_closed' && (
                        <svg className={`w-4 h-4 ${fundraisingSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleFundraisingSort('tnifmc_request_inr_cr')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Request (₹ Cr)</span>
                      {fundraisingSortField === 'tnifmc_request_inr_cr' && (
                        <svg className={`w-4 h-4 ${fundraisingSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleFundraisingSort('commitment_amount_inr_cr')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Commitment (₹ Cr)</span>
                      {fundraisingSortField === 'commitment_amount_inr_cr' && (
                        <svg className={`w-4 h-4 ${fundraisingSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleFundraisingSort('investor_type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Investor Type</span>
                      {fundraisingSortField === 'investor_type' && (
                        <svg className={`w-4 h-4 ${fundraisingSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleFundraisingSort('responsibility_tnifmc')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Responsible</span>
                      {fundraisingSortField === 'responsibility_tnifmc' && (
                        <svg className={`w-4 h-4 ${fundraisingSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedFundraising.map((fund, index) => (
                  <tr key={fund.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer`}
                      onClick={() => {
                        setSelectedFundraising(fund);
                        setFundraisingEditFormData(fund);
                        setIsFundraisingEditMode(false);
                        setActiveView('fundraising-detail');
                      }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-900">{fund.organisation}</div>
                      {fund.current_status && (
                        <div className="text-xs text-gray-500 mt-1">{fund.current_status}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        fund.status_open_closed === 'Invested' 
                          ? 'bg-green-100 text-green-800'
                          : fund.status_open_closed === 'Open'
                          ? 'bg-blue-100 text-blue-800'
                          : fund.status_open_closed === 'Closed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {fund.status_open_closed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {fund.tnifmc_request_inr_cr ? `₹${fund.tnifmc_request_inr_cr}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {fund.commitment_amount_inr_cr ? `₹${fund.commitment_amount_inr_cr}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{fund.investor_type || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{fund.responsibility_tnifmc || 'Unassigned'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {fund.feeler_teaser_letter_sent && (
                          <span className="inline-block w-2 h-2 bg-green-400 rounded-full" title="Teaser Sent"></span>
                        )}
                        {fund.meetings_detailed_discussions_im_sent && (
                          <span className="inline-block w-2 h-2 bg-blue-400 rounded-full" title="Meetings Held"></span>
                        )}
                        {fund.due_diligence_queries && (
                          <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full" title="Due Diligence"></span>
                        )}
                        {fund.commitment_letter_conclusion && (
                          <span className="inline-block w-2 h-2 bg-purple-400 rounded-full" title="Commitment Letter"></span>
                        )}
                        {fund.initial_final_drawdown && (
                          <span className="inline-block w-2 h-2 bg-red-400 rounded-full" title="Drawdown"></span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Showing {processedFundraising.length} fundraising records{fundraising.length !== processedFundraising.length ? ` of ${fundraising.length} total` : ''}</span>
              <div className="flex space-x-4">
                <span>Invested: {processedFundraising.filter(f => f.status_open_closed === 'Invested').length}</span>
                <span>Open: {processedFundraising.filter(f => f.status_open_closed === 'Open').length}</span>
                <span>Closed: {processedFundraising.filter(f => f.status_open_closed === 'Closed').length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };

  const renderFundraisingDetail = () => {
    if (!selectedFundraising) return null;

    const handleBackToFundraising = () => {
      setSelectedFundraising(null);
      setFundraisingEditFormData(null);
      setIsFundraisingEditMode(false);
      setShowFundraisingDeleteConfirm(false);
      setActiveView('fundraising');
    };

    const handleEditFundraising = () => {
      setIsFundraisingEditMode(true);
    };

    const handleCancelFundraisingEdit = () => {
      setFundraisingEditFormData(selectedFundraising);
      setIsFundraisingEditMode(false);
    };

    const handleSaveFundraising = async () => {
      if (!fundraisingEditFormData || !fundraisingEditFormData.id) return;
      
      try {
        setLoading(true);
        await fundraisingApi.update(fundraisingEditFormData.id, fundraisingEditFormData);
        
        // Update the selected fundraising and fundraising list
        setSelectedFundraising(fundraisingEditFormData);
        setFundraising(fundraising.map(f => 
          f.id === fundraisingEditFormData.id ? fundraisingEditFormData : f
        ));
        setIsFundraisingEditMode(false);
        setError('');
      } catch (err: any) {
        setError(`Failed to update fundraising: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteFundraising = async () => {
      if (!selectedFundraising?.id) return;
      
      try {
        setLoading(true);
        await fundraisingApi.delete(selectedFundraising.id);
        
        // Remove from fundraising list and go back
        setFundraising(fundraising.filter(f => f.id !== selectedFundraising.id));
        handleBackToFundraising();
        setError('');
      } catch (err: any) {
        setError(`Failed to delete fundraising: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const renderField = (label: string, value: any, field: keyof Fundraising, type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox' = 'text', options?: string[]) => (
      <div className="border-b border-gray-200 py-3">
        <div className="flex justify-between items-start">
          <label className="block text-sm font-medium text-gray-700 w-1/3 pt-2">
            {label}
          </label>
          {isFundraisingEditMode && fundraisingEditFormData ? (
            type === 'textarea' ? (
              <textarea
                value={String(fundraisingEditFormData[field] || '')}
                onChange={(e) => setFundraisingEditFormData({
                  ...fundraisingEditFormData,
                  [field]: e.target.value
                })}
                rows={3}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="ml-2 w-2/3 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : type === 'select' && options ? (
              <select
                value={String(fundraisingEditFormData[field] || '')}
                onChange={(e) => setFundraisingEditFormData({
                  ...fundraisingEditFormData,
                  [field]: e.target.value
                })}
                aria-label={label}
                className="ml-2 w-2/3 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select {label.toLowerCase()}</option>
                {options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={Boolean(fundraisingEditFormData[field])}
                onChange={(e) => setFundraisingEditFormData({
                  ...fundraisingEditFormData,
                  [field]: e.target.checked
                })}
                aria-label={label}
                className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            ) : type === 'number' ? (
              <input
                type="number"
                value={fundraisingEditFormData[field] ? String(fundraisingEditFormData[field]) : ''}
                onChange={(e) => setFundraisingEditFormData({
                  ...fundraisingEditFormData,
                  [field]: parseFloat(e.target.value) || 0
                })}
                step="0.01"
                placeholder={`Enter ${label.toLowerCase()}`}
                className="ml-2 w-2/3 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <input
                type="text"
                value={String(fundraisingEditFormData[field] || '')}
                onChange={(e) => setFundraisingEditFormData({
                  ...fundraisingEditFormData,
                  [field]: e.target.value
                })}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="ml-2 w-2/3 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )
          ) : (
            <span className="ml-2 w-2/3 text-gray-900">
              {type === 'checkbox' ? 
                (value ? '✓ Yes' : '✗ No') : 
                (value || 'Not specified')
              }
            </span>
          )}
        </div>
      </div>
    );

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedFundraising.organisation} - Fundraising Details
          </h2>
          <div className="flex space-x-3">
            {!isFundraisingEditMode ? (
              <>
                <button
                  onClick={handleEditFundraising}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setShowFundraisingDeleteConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveFundraising}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelFundraisingEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={handleBackToFundraising}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to Campaigns
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Fundraising Information</h3>
          </div>
          
          <div className="px-6 py-4 space-y-1">
            {renderField('Organization', selectedFundraising.organisation, 'organisation')}
            {renderField('Status', selectedFundraising.status_open_closed, 'status_open_closed', 'select', ['Open', 'Closed', 'Invested'])}
            {renderField('Reference', selectedFundraising.reference, 'reference')}
            {renderField('TNIFMC Request (₹ Cr)', selectedFundraising.tnifmc_request_inr_cr, 'tnifmc_request_inr_cr', 'number')}
            {renderField('Commitment Amount (₹ Cr)', selectedFundraising.commitment_amount_inr_cr, 'commitment_amount_inr_cr', 'number')}
            {renderField('Investor Type', selectedFundraising.investor_type, 'investor_type')}
            {renderField('Responsible (TNIFMC)', selectedFundraising.responsibility_tnifmc, 'responsibility_tnifmc')}
            {renderField('Current Status', selectedFundraising.current_status, 'current_status')}
            {renderField('First Meeting Date', selectedFundraising.date_of_first_meeting_call, 'date_of_first_meeting_call')}
            
            <div className="border-b border-gray-200 py-4">
              <h4 className="text-md font-medium text-gray-700 mb-4">Process Tracking Steps</h4>
              <div className="space-y-3">
                {/* Process tracking checkboxes with better layout */}
                {[
                  { label: 'Feeler/Teaser Letter Sent', field: 'feeler_teaser_letter_sent', value: selectedFundraising.feeler_teaser_letter_sent },
                  { label: 'Meetings/Discussions/IM Sent', field: 'meetings_detailed_discussions_im_sent', value: selectedFundraising.meetings_detailed_discussions_im_sent },
                  { label: 'Initial Appraisal/Evaluation Process Started', field: 'initial_appraisal_evaluation_process_started', value: selectedFundraising.initial_appraisal_evaluation_process_started },
                  { label: 'Due Diligence Queries', field: 'due_diligence_queries', value: selectedFundraising.due_diligence_queries },
                  { label: 'Commitment Letter Concluded', field: 'commitment_letter_conclusion', value: selectedFundraising.commitment_letter_conclusion },
                  { label: 'Initial/Final Drawdown', field: 'initial_final_drawdown', value: selectedFundraising.initial_final_drawdown }
                ].map((step, index) => (
                  <div key={step.field} className="flex items-center py-2">
                    <div className="flex items-center min-w-0 flex-1">
                      {/* Step number */}
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
                        step.value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      
                      {/* Checkbox */}
                      {isFundraisingEditMode && fundraisingEditFormData ? (
                        <label className="flex items-center cursor-pointer min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={Boolean(fundraisingEditFormData[step.field as keyof Fundraising])}
                            onChange={(e) => setFundraisingEditFormData({
                              ...fundraisingEditFormData,
                              [step.field]: e.target.checked
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3 flex-shrink-0"
                          />
                          <span className="text-sm text-gray-700 font-medium">{step.label}</span>
                        </label>
                      ) : (
                        <div className="flex items-center min-w-0 flex-1">
                          <div className={`h-4 w-4 rounded border mr-3 flex-shrink-0 flex items-center justify-center ${
                            step.value ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
                          }`}>
                            {step.value && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm font-medium min-w-0 flex-1 ${
                            step.value ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </span>
                          {step.value && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                              Completed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {renderField('Notes', selectedFundraising.notes, 'notes', 'textarea')}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showFundraisingDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this fundraising record for {selectedFundraising.organisation}? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowFundraisingDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteFundraising}
                  disabled={loading}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUsers = () => {
    const processedUsers = getProcessedUsers();
    
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Team Members ({processedUsers.length}{users.length !== processedUsers.length ? ` of ${users.length}` : ''})
          </h2>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users by name, email, phone, organization, position, roles, status, notes..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
            {userSearchTerm && (
              <button
                onClick={() => setUserSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      ) : processedUsers.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {userSearchTerm ? 'No users match your search criteria.' : 'No users found. Add some sample data to see it here!'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleUserSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {userSortField === 'name' && (
                        <svg className={`w-4 h-4 ${userSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleUserSort('email')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Contact Info</span>
                      {userSortField === 'email' && (
                        <svg className={`w-4 h-4 ${userSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleUserSort('designation')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Position</span>
                      {userSortField === 'designation' && (
                        <svg className={`w-4 h-4 ${userSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleUserSort('organisation')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Organization</span>
                      {userSortField === 'organisation' && (
                        <svg className={`w-4 h-4 ${userSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleUserSort('roles')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Roles</span>
                      {userSortField === 'roles' && (
                        <svg className={`w-4 h-4 ${userSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleUserSort('is_active')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {userSortField === 'is_active' && (
                        <svg className={`w-4 h-4 ${userSortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedUsers.map((user, index) => (
                  <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-800">
                              {user.username?.charAt(0)?.toUpperCase() || user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-900 cursor-pointer hover:underline"
                               onClick={() => {
                                 setSelectedUser(user);
                                 setUserEditFormData(user);
                                 setActiveView('user-detail');
                               }}>
                            {user.username || user.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.email && (
                          <a 
                            href={`mailto:${user.email}`}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            {user.email}
                          </a>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.phone && (
                          <a 
                            href={`tel:${user.phone}`}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            {user.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.designation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.organisation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.roles && user.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role, idx) => (
                              <span key={idx} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {role}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Showing {processedUsers.length} users{users.length !== processedUsers.length ? ` of ${users.length} total` : ''}</span>
              <div className="flex space-x-4">
                <span>Active: {processedUsers.filter(u => u.is_active).length}</span>
                <span>Inactive: {processedUsers.filter(u => !u.is_active).length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };

  const renderContent = () => {
    switch (activeView) {
      case 'contacts':
        return renderContacts();
      case 'contact-detail':
        return renderContactDetail();
      case 'organizations':
        return renderOrganizations();
      case 'organization-detail':
        return renderOrganizationDetail();
      case 'fundraising':
        return renderFundraising();
      case 'fundraising-detail':
        return renderFundraisingDetail();
      case 'users':
        return renderUsers();
      case 'user-detail':
        return renderUserDetail();
      default:
        return renderOrganizations();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            TNIFMC Lead Management System
          </h1>
          <p className="text-xl text-gray-600">
            Investment tracking and lead management platform
          </p>
        </header>
        
        {renderBackendStatus()}
        
        {renderNavigationBar()}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            ❌ {error}
          </div>
        )}
        
        {renderContent()}
        
        <footer className="mt-12 text-center text-gray-500">
          <p>© 2025 TNIFMC Lead Management System</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
