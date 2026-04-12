import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Search,
  ArrowUp,
  ArrowDown,
  Building2,
  Phone,
  Mail,
  Users,
} from 'lucide-react';
import { contactsApi, Contact } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface ContactListProps {
  onSelectContact: (contact: Contact) => void;
  onCreateNew: () => void;
}

const ContactList: React.FC<ContactListProps> = ({ onSelectContact, onCreateNew }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Contact | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await contactsApi.getAll();
      setContacts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Contact) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedContacts = contacts
    .filter(contact =>
      (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.organisation && contact.organisation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (!sortField) return 0;

      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const getSortIcon = (field: keyof Contact) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 inline ml-1" />
      : <ArrowDown className="w-3 h-3 inline ml-1" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <Button onClick={onCreateNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('name')}
              >
                Name {getSortIcon('name')}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('organisation')}
              >
                Organization {getSortIcon('organisation')}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('designation')}
              >
                Designation {getSortIcon('designation')}
              </TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedContacts.map((contact) => (
              <TableRow
                key={contact.id}
                className="cursor-pointer"
                onClick={() => onSelectContact(contact)}
              >
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{contact.organisation}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.designation || '—'}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {contact.email && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        {contact.email}
                      </div>
                    )}
                    {(contact.phone || contact.mobile) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {contact.phone || contact.mobile}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onSelectContact(contact); }}
                    title="Edit contact"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredAndSortedContacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium">No contacts found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new contact.'}
            </p>
            {!searchTerm && (
              <Button onClick={onCreateNew} size="sm" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredAndSortedContacts.length} contact{filteredAndSortedContacts.length !== 1 ? 's' : ''}
        {contacts.length !== filteredAndSortedContacts.length ? ` of ${contacts.length} total` : ''}
      </p>
    </div>
  );
};

export default ContactList;