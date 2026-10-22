import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SearchBar = React.memo(function SearchBar({
  value,
  onChange,
  placeholder = 'Search mail, people, and events...',
}: SearchBarProps) {
  const handleClear = React.useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={styles.container}>
      <span className={styles.icon}>
        <Search size={14} />
      </span>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value ? (
        <button
          className={styles.clearButton}
          onClick={handleClear}
          title="Clear search"
          type="button"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  );
});
