import React, { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { KeycloakWithPKCE } from '../utils/keycloakWithPKCE';

const ReportPage: React.FC = () => {
  const { keycloak, initialized } = useKeycloak();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ReportPage: Component mounted');
    console.log('ReportPage: initialized:', initialized);
    console.log('ReportPage: keycloak.authenticated:', keycloak?.authenticated);
    console.log('ReportPage: keycloak.token:', keycloak?.token ? 'Present' : 'Missing');
  }, [keycloak, initialized]);

  const [reports, setReports] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);

  const fetchReports = async () => {
    if (!keycloak?.token) {
      setError('Not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/reports`, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReports(data.data || []);
      setPagination(data.pagination || null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    keycloak.logout();
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Since App.tsx already checks authentication, we can assume user is authenticated here
  const pkceKeycloak = keycloak as KeycloakWithPKCE;
  const userInfo = keycloak.tokenParsed;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Usage Reports</h1>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Logout
          </button>
        </div>

        {userInfo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">User Info</h3>
            <p className="text-sm text-blue-700">
              <strong>Username:</strong> {userInfo.preferred_username || 'N/A'}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Email:</strong> {userInfo.email || 'N/A'}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Authentication:</strong> PKCE Enabled
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={fetchReports}
            disabled={loading}
            className={`w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Загрузка отчетов...' : 'Загрузить отчеты'}
          </button>

          {reports.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Отчеты:</h3>
              {reports.map((report) => (
                <div key={report.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{report.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.status === 'active' ? 'bg-green-100 text-green-800' :
                      report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  <div className="text-xs text-gray-500 mb-3">
                    <span>Автор: {report.author}</span>
                    <span className="ml-4">Создан: {new Date(report.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Пользователей: {report.metrics.total_users}</div>
                    <div>Активных: {report.metrics.active_users}</div>
                    <div>Доход: {report.metrics.revenue.toLocaleString()} ₽</div>
                    <div>Рост: {report.metrics.growth_rate}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Security Features</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• PKCE (Proof Key for Code Exchange) enabled</li>
            <li>• SHA256 code challenge method</li>
            <li>• Secure token exchange</li>
            <li>• CSRF protection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;