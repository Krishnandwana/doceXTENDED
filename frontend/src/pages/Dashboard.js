import { useState, useEffect } from 'react';
import {
  Shield,
  CreditCard,
  FileText,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  FileCheck,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState('checking');
  const [stats, setStats] = useState({
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    pendingVerifications: 0
  });

  // Mock recent activity data
  const [recentActivity] = useState([
    {
      id: 1,
      type: 'id_verification',
      user: 'John Doe',
      status: 'verified',
      timestamp: '2 minutes ago',
      icon: User
    },
    {
      id: 2,
      type: 'document_verification',
      user: 'Invoice_001.pdf',
      status: 'authentic',
      timestamp: '15 minutes ago',
      icon: FileCheck
    },
    {
      id: 3,
      type: 'document_verification',
      user: 'Certificate.jpg',
      status: 'suspicious',
      timestamp: '1 hour ago',
      icon: FileCheck
    },
    {
      id: 4,
      type: 'id_verification',
      user: 'Jane Smith',
      status: 'verified',
      timestamp: '2 hours ago',
      icon: User
    }
  ]);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const { documentAPI } = await import('../services/api');
        await documentAPI.checkHealth();
        setBackendStatus('connected');
        // Mock stats update
        setStats({
          totalVerifications: 147,
          successfulVerifications: 132,
          failedVerifications: 8,
          pendingVerifications: 7
        });
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    checkBackendHealth();
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
      case 'authentic':
        return 'bg-green-100 text-green-800';
      case 'suspicious':
      case 'failed':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
      case 'authentic':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'failed':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Document Verification Platform
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome to your verification dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Backend Status Alert */}
        <div
          className={`rounded-2xl p-4 mb-8 ${
            backendStatus === 'connected'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {backendStatus === 'connected' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p
                className={`font-medium ${
                  backendStatus === 'connected' ? 'text-green-900' : 'text-red-900'
                }`}
              >
                Backend Status:{' '}
                {backendStatus === 'connected'
                  ? 'Connected and ready for verification'
                  : 'Disconnected - Please start the backend server'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* ID Verification Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    ID Verification
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Verify identity cards with face matching
                  </p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-6">
                Upload an ID card, extract personal data, and verify identity with live face
                matching. Secure storage for future use.
              </p>
              <button
                onClick={() => navigate('/id-verification')}
                disabled={backendStatus !== 'connected'}
                className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                  backendStatus === 'connected'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Verify New Identity</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Document Verification Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Document Verification
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Check document authenticity and detect forgery
                  </p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-6">
                Upload any document to analyze for forgery, tampering, or authenticity issues.
                AI-powered detection with detailed reporting.
              </p>
              <button
                onClick={() => navigate('/document-verification')}
                disabled={backendStatus !== 'connected'}
                className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                  backendStatus === 'connected'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Check Document Authenticity</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Verifications */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalVerifications}
                </p>
                <p className="text-sm text-gray-600">Total Verifications</p>
              </div>
            </div>
          </div>

          {/* Successful */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.successfulVerifications}
                </p>
                <p className="text-sm text-gray-600">Successful</p>
              </div>
            </div>
          </div>

          {/* Failed */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.failedVerifications}
                </p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.pendingVerifications}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {activity.user}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          activity.status
                        )}`}
                      >
                        {getStatusIcon(activity.status)}
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {activity.type === 'id_verification'
                        ? 'ID Verification'
                        : 'Document Verification'}{' '}
                      • {activity.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
