import React, { useState, useRef, useEffect } from 'react';

interface Organization {
  id?: string;
  name: string;
  // Add other organization fields as needed
}

interface OrganizationSelectProps {
  organizations: Organization[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const OrganizationSelect: React.FC<OrganizationSelectProps> = ({
  organizations,
  value,
  onChange,
  placeholder = "Select or enter organization",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = organizations.filter(org =>
        org.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOrganizations(filtered);
      setSelectedIndex(-1);
    } else {
      setFilteredOrganizations(organizations);
      setSelectedIndex(-1);
    }
  }, [inputValue, organizations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for click events on options
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleOptionClick = (organization: Organization) => {
    setInputValue(organization.name);
    onChange(organization.name);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
        setSelectedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredOrganizations.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredOrganizations[selectedIndex]) {
          handleOptionClick(filteredOrganizations[selectedIndex]);
        } else {
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const showDropdown = isOpen && filteredOrganizations.length > 0;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoComplete="off"
      />
      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
        >
          {filteredOrganizations.map((org, index) => (
            <li
              key={org.id || `org-${index}`}
              onClick={() => handleOptionClick(org)}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
            >
              {org.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrganizationSelect;