import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard CEO - Loja Personal Prime',
  description: 'Dashboard executivo com métricas estratégicas e indicadores de performance',
};

interface CEODashboardLayoutProps {
  children: React.ReactNode;
}

export default function CEODashboardLayout({ children }: CEODashboardLayoutProps) {
  return (
    <div className="ceo-dashboard-layout">
      {children}
    </div>
  );
}