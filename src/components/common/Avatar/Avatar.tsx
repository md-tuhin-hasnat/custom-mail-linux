import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name[0] || '?').toUpperCase();
}

export const Avatar = React.memo(function Avatar({
  name,
  color = '#0a84ff',
  size = 'md',
}: AvatarProps) {
  const initials = getInitials(name);
  const sizeClass = styles[size] || styles.md;

  return (
    <div
      className={`${styles.avatar} ${sizeClass}`}
      style={{ backgroundColor: color }}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
});
