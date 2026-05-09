// ============================================================================
// Login Page — role selection for dev/mock environment
// ============================================================================

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth';
import { MOCK_USERS } from '@/auth/mock-auth';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();

  const roleConfig = [
    { ...MOCK_USERS[0], label: t('auth.roleMaker'), color: 'bg-blue-600 hover:bg-blue-700', icon: 'M' },
    { ...MOCK_USERS[1], label: t('auth.roleChecker'), color: 'bg-green-600 hover:bg-green-700', icon: 'K' },
    { ...MOCK_USERS[2], label: t('auth.roleApprover'), color: 'bg-purple-600 hover:bg-purple-700', icon: 'P' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-700">{t('app.title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('auth.title')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('auth.selectRole')}</p>
        </div>

        {/* Role selection cards */}
        <div className="space-y-3">
          {roleConfig.map((config) => (
            <button
              key={config.userId}
              onClick={() => login(config.role)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg text-white ${config.color} transition-colors shadow-md`}
            >
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-lg font-bold">
                {config.icon}
              </div>
              <div className="text-left">
                <p className="font-medium">{config.label}</p>
                <p className="text-sm opacity-80">{config.userName} — {config.unitName}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          VDBAS TT.OUT.MANUAL v1.0.0 — Moi truong phat trien
        </p>
      </div>
    </div>
  );
}
