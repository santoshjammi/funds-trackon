import React, { useState, useEffect } from 'react';
import { contactsApi, fundraisingApi, usersApi, organizationsApi, healthCheck, Contact, Fundraising, User, Organization } from './services/api';

function App() {
  const [activeView, setActiveView] = useState<'contacts' | 'contact-detail' | 'organizations' | 'organization-detail' | 'fundraising' | 'users' | 'user-detail'>('organizations');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1>Test App</h1>
      </div>
    </div>
  );
}

export default App;