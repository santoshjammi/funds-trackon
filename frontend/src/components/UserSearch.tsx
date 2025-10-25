import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, Contact } from '../services/api';

interface UserSearchProps {
  users: User[];
  contacts?: Contact[];
  value: string;
  onChange: (value: string, type: 'user' | 'contact', id: string) => void;
  placeholder?: string;
  label?: string;
  includeContacts?: boolean;
  className?: string;
  loading?: boolean;
}

interface AssigneeOption {
  id: string;
  display: string;
  searchText: string;
  type: 'user' | 'contact';
  data: User | Contact;
}

const UserSearch: React.FC<UserSearchProps> = ({
  users,
  contacts = [],
  value,
  onChange,
  placeholder = "Search users...",
  label,
  includeContacts = false,
  className = "",
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Prepare assignee data
  const assigneeData = useMemo(() => {
    const userOptions: AssigneeOption[] = users
      .filter(user => user.id)
      .map(user => ({
        id: user.id!,
        display: `${user.name} (${user.email})`,
        searchText: `${user.name} ${user.email}`.toLowerCase(),
        type: 'user' as const,
        data: user
      }));

    const contactOptions: AssigneeOption[] = includeContacts ? contacts
      .filter(contact => contact.id)
      .map(contact => ({
        id: contact.id!,
        display: `${contact.name} (${contact.organisation || 'No Organization'})`,
        searchText: `${contact.name} ${contact.organisation || ''} ${contact.email || ''}`.toLowerCase(),
        type: 'contact' as const,
        data: contact
      })) : [];

    return {
      allOptions: [...userOptions, ...contactOptions],
      userMap: new Map(userOptions.map(opt => [opt.id, opt])),
      contactMap: new Map(contactOptions.map(opt => [opt.id, opt]))
    };
  }, [users, contacts, includeContacts]);

  // Get current display value
  const getCurrentDisplay = useCallback(() => {
    if (!value) return '';

    const userAssignee = assigneeData.userMap.get(value);
    if (userAssignee) return userAssignee.display;

    if (includeContacts) {
      const contactAssignee = assigneeData.contactMap.get(value);
      if (contactAssignee) return contactAssignee.display;
    }

    return '';
  }, [value, assigneeData, includeContacts]);

  // Update search term when value changes
  useEffect(() => {
    setSearchTerm(getCurrentDisplay());
  }, [getCurrentDisplay]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return assigneeData.allOptions;
    }

    const searchLower = searchTerm.toLowerCase();
    return assigneeData.allOptions.filter(option =>
      option.searchText.includes(searchLower)
    );
  }, [searchTerm, assigneeData.allOptions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setShowDropdown(true);
    setSelectedIndex(-1);

    // If user clears the field, notify parent
    if (!newValue.trim()) {
      onChange('', 'user', '');
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: AssigneeOption) => {
    setSearchTerm(option.display);
    setShowDropdown(false);
    setSelectedIndex(-1);
    onChange(option.display, option.type, option.id);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown') {
        setShowDropdown(true);
        setSelectedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          handleOptionSelect(filteredOptions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => {
            // Delay hiding dropdown to allow for option selection
            setTimeout(() => setShowDropdown(false), 200);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {showDropdown && loading && assigneeData.allOptions.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        )}
        {showDropdown && !loading && filteredOptions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.map((option, index) => (
              <div
                key={`${option.type}-${option.id}`}
                onClick={() => handleOptionSelect(option)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    option.type === 'user' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></span>
                  <span className="text-sm">
                    {option.display}
                    <span className="text-xs text-gray-500 ml-1">
                      ({option.type})
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {showDropdown && !loading && filteredOptions.length === 0 && searchTerm.trim() && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
            <span className="text-sm text-gray-500">No matches found</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;