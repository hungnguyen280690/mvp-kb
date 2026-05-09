// ============================================================================
// StatusBadge — colored badge for LTT state
// ============================================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LttState, STATE_COLORS } from '@/types';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { t } = useTranslation();

  const colorClass = STATE_COLORS[status as LttState] || 'bg-gray-100 text-gray-800';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const label = t(`states.${status}`, { defaultValue: status });

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${colorClass} ${sizeClass}`}
      role="status"
      aria-label={`Trang thai: ${label}`}
    >
      {label}
    </span>
  );
}
