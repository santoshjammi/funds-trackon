import React from 'react';
import { Contact } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Pencil, Trash2 } from 'lucide-react';

interface ContactViewProps {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="mt-0.5 text-sm">{value || '—'}</p>
  </div>
);

const ContactView: React.FC<ContactViewProps> = ({ contact, onEdit, onDelete }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">{contact.name}</h2>
        <div className="flex gap-2">
          <Button onClick={onEdit} size="sm">
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button onClick={onDelete} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name" value={contact.name} />
            <Field label="Organization" value={contact.organisation} />
            <Field label="Designation" value={contact.designation} />
            <Field label="Branch / Department" value={contact.branch_department} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Email" value={contact.email} />
            <Field label="Phone" value={contact.phone} />
            <Field label="Mobile" value={contact.mobile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Geography / Region" value={contact.geography_region} />
            <Field label="Country / Location" value={contact.country_location} />
            <Field label="Sub-location" value={contact.sub_location} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Additional</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Address" value={contact.address} />
            <Field label="Notes" value={contact.notes_comments} />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <div className="mt-1">
                <Badge variant={contact.status === 'active' ? 'success' : 'destructive'}>
                  {contact.status || 'unknown'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Timestamps</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Created At"
            value={contact.created_at ? new Date(contact.created_at).toLocaleString() : undefined}
          />
          <Field
            label="Updated At"
            value={contact.updated_at ? new Date(contact.updated_at).toLocaleString() : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactView;
