import React from 'react';
import { Organization } from '../services/api';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SelectNative } from './ui/select-native';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        {isEdit ? 'Edit Organization' : 'Create New Organization'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Organization Name *</Label>
            <Input
              type="text"
              value={safeFormData.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              required
              placeholder="Enter organization name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <SelectNative
              id="industry"
              value={safeFormData.industry || ''}
              onChange={(e) => onChange('industry', e.target.value)}
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
            </SelectNative>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            value={safeFormData.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
            placeholder="Brief description of the organization..."
          />
        </div>

        <Separator />

        {/* Contact Information */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input
                type="url"
                value={safeFormData.website || ''}
                onChange={(e) => onChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={safeFormData.email || ''}
                onChange={(e) => onChange('email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label>Phone</Label>
            <Input
              type="tel"
              value={safeFormData.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <Separator />

        {/* Location Information */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Location Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                type="text"
                value={safeFormData.address || ''}
                onChange={(e) => onChange('address', e.target.value)}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                type="text"
                value={safeFormData.city || ''}
                onChange={(e) => onChange('city', e.target.value)}
                placeholder="Enter city"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input
                type="text"
                value={safeFormData.country || ''}
                onChange={(e) => onChange('country', e.target.value)}
                placeholder="Enter country"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Input
                type="text"
                value={safeFormData.region || ''}
                onChange={(e) => onChange('region', e.target.value)}
                placeholder="e.g., North America, Europe, Asia-Pacific"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Business Information */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Organization Size</Label>
              <SelectNative
                value={safeFormData.size || ''}
                onChange={(e) => onChange('size', e.target.value)}
              >
                <option value="">Select Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1001-5000">1001-5000 employees</option>
                <option value="5000+">5000+ employees</option>
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label>Founded Year</Label>
              <Input
                type="number"
                value={safeFormData.founded_year || ''}
                onChange={(e) => onChange('founded_year', e.target.value ? parseInt(e.target.value) : 0)}
                placeholder="2024"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Annual Revenue</Label>
              <SelectNative
                value={safeFormData.revenue || ''}
                onChange={(e) => onChange('revenue', e.target.value)}
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
              </SelectNative>
            </div>
          </div>
        </div>

        <Separator />

        {/* Relationship Information */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Relationship Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <SelectNative
                id="status"
                value={safeFormData.status || 'Active'}
                onChange={(e) => onChange('status', e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Prospect">Prospect</option>
                <option value="Partner">Partner</option>
                <option value="Competitor">Competitor</option>
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label>Relationship Type</Label>
              <Input
                type="text"
                value={safeFormData.relationship_type || ''}
                onChange={(e) => onChange('relationship_type', e.target.value)}
                placeholder="e.g., Client, Vendor, Partner"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <SelectNative
                id="priority"
                value={safeFormData.priority || 'Medium'}
                onChange={(e) => onChange('priority', e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </SelectNative>
            </div>
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea
            value={safeFormData.notes || ''}
            onChange={(e) => onChange('notes', e.target.value)}
            rows={4}
            placeholder="Additional notes about this organization..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Update Organization' : 'Create Organization'}</Button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationForm;
