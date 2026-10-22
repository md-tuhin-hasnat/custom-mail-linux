import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, UserPlus } from 'lucide-react';
import { AccountConfig } from '@/types/account';
import { Avatar } from '@/components/common/Avatar/Avatar';
import styles from './AccountSwitcher.module.css';

interface AccountSwitcherProps {
  accounts: AccountConfig[];
  activeAccount: AccountConfig | null;
  onSelectAccount: (id: string) => void;
  onOpenAddAccount: () => void;
}

export const AccountSwitcher = React.memo(function AccountSwitcher({
  accounts,
  activeAccount,
  onSelectAccount,
  onOpenAddAccount,
}: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = activeAccount?.name || activeAccount?.email || 'Select Account';

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        aria-expanded={isOpen}
      >
        <Avatar
          name={displayName}
          size="sm"
          color={activeAccount?.avatarColor || '#0a84ff'}
        />
        <span className={styles.accountName}>{displayName}</span>
        <ChevronDown size={13} className={styles.chevron} />
      </button>

      {isOpen ? (
        <div className={styles.dropdown} role="menu">
          {accounts.map((acc) => {
            const isCurrent = acc.id === activeAccount?.id;
            return (
              <div
                key={acc.id}
                className={styles.item}
                onClick={() => {
                  onSelectAccount(acc.id);
                  setIsOpen(false);
                }}
                role="menuitem"
              >
                <div className={styles.itemLeft}>
                  <Avatar name={acc.name} size="sm" color={acc.avatarColor} />
                  <div className={styles.itemText}>
                    <span className={styles.itemName}>{acc.name}</span>
                    <span className={styles.itemEmail}>{acc.email}</span>
                  </div>
                </div>
                {isCurrent ? <Check size={14} className={styles.check} /> : null}
              </div>
            );
          })}

          <div className={styles.divider} />

          <button
            className={styles.addButton}
            onClick={() => {
              setIsOpen(false);
              onOpenAddAccount();
            }}
            type="button"
          >
            <UserPlus size={14} />
            <span>Add Account...</span>
          </button>
        </div>
      ) : null}
    </div>
  );
});
