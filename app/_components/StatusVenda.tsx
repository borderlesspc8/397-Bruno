import React from 'react';
import { GestaoClickStatusType } from '@/app/_types/gestao-click';
import { getStatusColor, getStatusDescription } from '@/app/_utils/status-validator';

interface StatusVendaProps {
  status: GestaoClickStatusType;
  className?: string;
}

export function StatusVenda({ status, className = '' }: StatusVendaProps) {
  const backgroundColor = getStatusColor(status);
  const description = getStatusDescription(status);

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${className}`}
      style={{
        backgroundColor,
        color: '#FFFFFF',
        textShadow: '0 1px 1px rgba(0,0,0,0.2)'
      }}
    >
      <span className="mr-1.5 h-2 w-2 rounded-full bg-white/80" />
      {description}
    </div>
  );
}

export default StatusVenda; 