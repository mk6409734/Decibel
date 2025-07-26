
import React from 'react';
import { SirenStatus } from '@/types';

interface SirenStatusBadgeProps {
  status: SirenStatus;
}

const SirenStatusBadge: React.FC<SirenStatusBadgeProps> = ({ status }) => {
  const statusClasses = {
    active: 'status-active',
    inactive: 'status-inactive',
    warning: 'status-warning',
    alert: 'status-alert'
  };

  const statusText = {
    active: 'Online',
    inactive: 'Offline',
    warning: 'Warning',
    alert: 'Alert!'
  };

  return (
    <span className={statusClasses[status]}>
      {statusText[status]}
    </span>
  );
};

export default SirenStatusBadge;
