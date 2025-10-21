/**
 * 📊 CEO DASHBOARD - LOADING STATE
 */

export default function CEODashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
        <p className="mt-6 text-xl font-semibold text-gray-700">Carregando Dashboard CEO...</p>
        <p className="mt-2 text-sm text-gray-500">Processando indicadores financeiros</p>
      </div>
    </div>
  );
}


