import React from 'react';
import { Organization } from '../services/api';

interface OrganizationFormProps {
  formData: Organization;
  onChange: (field: keyof Organization, value: string | number | string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  isEdit: boolean;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  formData,
  onChange,
  onSave,
  onCancel,
  isEdit,
}) => {
  // Ensure formData is never null/undefined
  const safeFormData = formData || {
    name: '',
    industry: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    region: '',
    size: '',
    founded_year: 0,
    revenue: '',
    status: 'Active',
    relationship_type: '',
    priority: 'Medium',
    notes: '',
    tags: []
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {isEdit ? 'Edit Organization' : 'Create New Organization'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={safeFormData.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter organization name"
              title="Organization Name"
            />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              id="industry"
              value={safeFormData.industry || ''}
              onChange={(e) => onChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Industry</option>
              <option value="Banking">Banking</option>
              <option value="Insurance">Insurance</option>
              <option value="Mutual Funds">Mutual Funds</option>
              <option value="Pension Funds">Pension Funds</option>
              <option value="Asset Management">Asset Management</option>
              <option value="Sovereign Wealth Funds">Sovereign Wealth Funds</option>
              <option value="Consulting">Consulting</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Government">Government</option>
              <option value="FinTech">FinTech</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={safeFormData.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of the organization..."
          />
        </div>

        {/* Contact Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={safeFormData.website || ''}
                onChange={(e) => onChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={safeFormData.email || ''}
                onChange={(e) => onChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={safeFormData.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Phone"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        {/* Location Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Location Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={safeFormData.address || ''}
                onChange={(e) => onChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Address"
                placeholder="Enter address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={safeFormData.city || ''}
                onChange={(e) => onChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="City"
                placeholder="Enter city"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={safeFormData.country || ''}
                onChange={(e) => onChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Country"
                placeholder="Enter country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <input
                type="text"
                value={safeFormData.region || ''}
                onChange={(e) => onChange('region', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., North America, Europe, Asia-Pacific"
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Size
              </label>
              <select
                title="Organization Size"
                value={safeFormData.size || ''}
                onChange={(e) => onChange('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1001-5000">1001-5000 employees</option>
                <option value="5000+">5000+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Founded Year
              </label>
              <input
                type="number"
                value={safeFormData.founded_year || ''}
                onChange={(e) => onChange('founded_year', e.target.value ? parseInt(e.target.value) : 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2024"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Revenue
              </label>
              <select
                title="Annual Revenue"
                value={safeFormData.revenue || ''}
                onChange={(e) => onChange('revenue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Revenue Range</option>
                <option value="<1M">Less than $1M</option>
                <option value="1M-10M">$1M - $10M</option>
                <option value="10M-50M">$10M - $50M</option>
                <option value="50M-100M">$50M - $100M</option>
                <option value="100M-500M">$100M - $500M</option>
                <option value="500M-1B">$500M - $1B</option>
                <option value="1B-5B">$1B - $5B</option>
                <option value="5B-10B">$5B - $10B</option>
                <option value="10B+">$10B+</option>
              </select>
            </div>
          </div>
        </div>

        {/* Relationship Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Relationship Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={safeFormData.status || 'Active'}
                onChange={(e) => onChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Prospect">Prospect</option>
                <option value="Partner">Partner</option>
                <option value="Competitor">Competitor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship Type
              </label>
              <input
                type="text"
                value={safeFormData.relationship_type || ''}
                onChange={(e) => onChange('relationship_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Client, Vendor, Partner"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                title="Priority"
                value={safeFormData.priority || 'Medium'}
                onChange={(e) => onChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={safeFormData.notes || ''}
              onChange={(e) => onChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about this organization..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isEdit ? 'Update Organization' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationForm;