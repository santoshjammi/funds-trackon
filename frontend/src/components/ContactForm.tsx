import React from 'react';
import { Contact } from '../services/api';
import OrganizationSelect from './OrganizationSelect';

interface Organization {
  id?: string;
  name: string;
}

interface ContactFormProps {
  contact: Contact | null;
  onChange: (contact: Contact) => void;
  organizations?: Organization[];
}

const ContactForm: React.FC<ContactFormProps> = ({ contact, onChange, organizations = [] }) => {
  // Provide default empty contact for creation
  const currentContact = contact || {
    organisation: '',
    name: '',
    designation: '',
    branch_department: '',
    email: '',
    address: '',
    phone: '',
    mobile: '',
    geography_region: '',
    country_location: '',
    sub_location: '',
    notes_comments: '',
    status: 'active',
    created_at: '',
    updated_at: ''
  };

  const handleChange = (field: keyof Contact, value: string) => {
    onChange({
      ...currentContact,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={currentContact.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contact name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization *
              </label>
              <OrganizationSelect
                organizations={organizations}
                value={currentContact.organisation || ''}
                onChange={(value) => handleChange('organisation', value)}
                placeholder="Select or enter organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={currentContact.designation || ''}
                onChange={(e) => handleChange('designation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter designation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch/Department
              </label>
              <input
                type="text"
                value={currentContact.branch_department || ''}
                onChange={(e) => handleChange('branch_department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter branch or department"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={currentContact.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={currentContact.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile
              </label>
              <input
                type="tel"
                value={currentContact.mobile || ''}
                onChange={(e) => handleChange('mobile', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter mobile number"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Location Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geography/Region
              </label>
              <input
                type="text"
                value={currentContact.geography_region || ''}
                onChange={(e) => handleChange('geography_region', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter geography or region"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country/Location
              </label>
              <input
                type="text"
                value={currentContact.country_location || ''}
                onChange={(e) => handleChange('country_location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter country or location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-location
              </label>
              <input
                type="text"
                value={currentContact.sub_location || ''}
                onChange={(e) => handleChange('sub_location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter sub-location"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={currentContact.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes/Comments
              </label>
              <textarea
                value={currentContact.notes_comments || ''}
                onChange={(e) => handleChange('notes_comments', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notes or comments"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;