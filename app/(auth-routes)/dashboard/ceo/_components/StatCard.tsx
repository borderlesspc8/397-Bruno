/**
 * 📊 CEO DASHBOARD - STAT CARD (Estatísticas Simples)
 */

'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  sublabel?: string;
}

export function StatCard({ label, value, icon, color = 'blue', sublabel }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sublabel && (
        <p className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${colors[color]}`}>
          {sublabel}
        </p>
      )}
    </div>
  );
}



