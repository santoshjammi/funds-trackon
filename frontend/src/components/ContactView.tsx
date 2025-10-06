import React from 'react';
import { Contact } from '../services/api';

interface ContactViewProps {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}

const ContactView: React.FC<ContactViewProps> = ({ contact, onEdit, onDelete }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{contact.name}</h2>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Edit Contact
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Delete Contact"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <p className="text-gray-900">{contact.name || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Organization:</span>
              <p className="text-gray-900">{contact.organisation || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Designation:</span>
              <p className="text-gray-900">{contact.designation || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Branch/Department:</span>
              <p className="text-gray-900">{contact.branch_department || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <p className="text-gray-900">{contact.email || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <p className="text-gray-900">{contact.phone || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Mobile:</span>
              <p className="text-gray-900">{contact.mobile || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Location Information</h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Geography/Region:</span>
              <p className="text-gray-900">{contact.geography_region || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Country/Location:</span>
              <p className="text-gray-900">{contact.country_location || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Sub-location:</span>
              <p className="text-gray-900">{contact.sub_location || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Address:</span>
              <p className="text-gray-900 whitespace-pre-wrap">{contact.address || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Notes/Comments:</span>
              <p className="text-gray-900 whitespace-pre-wrap">{contact.notes_comments || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                contact.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {contact.status || 'Not specified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Timestamps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium text-gray-700">Created At:</span>
            <p className="text-gray-900">
              {contact.created_at ? new Date(contact.created_at).toLocaleString() : 'Not available'}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Updated At:</span>
            <p className="text-gray-900">
              {contact.updated_at ? new Date(contact.updated_at).toLocaleString() : 'Not available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactView;