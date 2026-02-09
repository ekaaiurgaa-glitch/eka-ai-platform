import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable FilterDropdown Component
 * 
 * A dropdown menu for filtering data lists with support for
 * single/multiple selection, search, and clear functionality.
 * 
 * @example
 * <FilterDropdown
 *   label="Status"
 *   options={[
 *     { label: 'Created', value: 'CREATED' },
 *     { label: 'In Progress', value: 'IN_PROGRESS' }
 *   ]}
 *   value={statusFilter}
 *   onChange={setStatusFilter}
 * />
 */
const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  multiple = false,
  searchable = false,
  clearable = true,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  
  const filteredOptions = searchable && searchTerm
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : value ? [value] : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  const displayLabel = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option?.label || placeholder;
    }
    return `${selectedValues.length} selected`;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          px-3 py-2 rounded-lg border text-sm
          transition-colors
          ${disabled 
            ? 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed' 
            : 'bg-white/5 border-white/10 text-gray-200 hover:border-white/20 hover:bg-white/10'
          }
          ${isOpen ? 'border-orange-500/50 ring-1 ring-orange-500/20' : ''}
        `}
      >
        <span className={selectedValues.length === 0 ? 'text-gray-500' : ''}>
          {displayLabel()}
        </span>
        <div className="flex items-center gap-1">
          {clearable && selectedValues.length > 0 && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-white/10 rounded text-gray-400 hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-auto">
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-white/10 sticky top-0 bg-[#1a1a1a]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                autoFocus
              />
            </div>
          )}
          
          {/* Options */}
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 text-sm
                      transition-colors
                      ${isSelected 
                        ? 'bg-orange-500/10 text-orange-400' 
                        : 'text-gray-300 hover:bg-white/5'
                      }
                    `}
                  >
                    {multiple && (
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center
                        ${isSelected 
                          ? 'bg-orange-500 border-orange-500' 
                          : 'border-gray-500'
                        }
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    )}
                    <span className="flex-1 text-left">{option.label}</span>
                    {!multiple && isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
