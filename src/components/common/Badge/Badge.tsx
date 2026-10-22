import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'warning' | 'success';
}

export const Badge = React.memo(function Badge({
  children,
  variant = 'secondary',
}: BadgeProps) {
  const variantClass = styles[variant] || styles.secondary;
  return <span className={`${styles.badge} ${variantClass}`}>{children}</span>;
});
