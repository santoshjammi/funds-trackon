import React from 'react';
import { Contact } from '../services/api';
import OrganizationSelect from './OrganizationSelect';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SelectNative } from './ui/select-native';

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
          <h3 className="text-base font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={currentContact.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter contact name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Organization <span className="text-destructive">*</span></Label>
              <OrganizationSelect
                organizations={organizations}
                value={currentContact.organisation || ''}
                onChange={(value) => handleChange('organisation', value)}
                placeholder="Select or enter organization name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={currentContact.designation || ''}
                onChange={(e) => handleChange('designation', e.target.value)}
                placeholder="Enter designation"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branch">Branch / Department</Label>
              <Input
                id="branch"
                value={currentContact.branch_department || ''}
                onChange={(e) => handleChange('branch_department', e.target.value)}
                placeholder="Enter branch or department"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={currentContact.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={currentContact.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                type="tel"
                value={currentContact.mobile || ''}
                onChange={(e) => handleChange('mobile', e.target.value)}
                placeholder="Enter mobile number"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-base font-semibold mb-4">Location Information</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="geo">Geography / Region</Label>
              <Input
                id="geo"
                value={currentContact.geography_region || ''}
                onChange={(e) => handleChange('geography_region', e.target.value)}
                placeholder="Enter geography or region"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country / Location</Label>
              <Input
                id="country"
                value={currentContact.country_location || ''}
                onChange={(e) => handleChange('country_location', e.target.value)}
                placeholder="Enter country or location"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subloc">Sub-location</Label>
              <Input
                id="subloc"
                value={currentContact.sub_location || ''}
                onChange={(e) => handleChange('sub_location', e.target.value)}
                placeholder="Enter sub-location"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-4">Additional Information</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={currentContact.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes / Comments</Label>
              <Textarea
                id="notes"
                value={currentContact.notes_comments || ''}
                onChange={(e) => handleChange('notes_comments', e.target.value)}
                rows={3}
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