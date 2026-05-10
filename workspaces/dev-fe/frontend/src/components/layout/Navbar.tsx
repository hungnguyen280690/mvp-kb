// ============================================================================
// Navbar component — top navigation bar
// ============================================================================

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth';

export function Navbar() {
  const { t } = useTranslation();
  const { user, logout, switchRole, availableUsers } = useAuth();

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    MAKER: t('auth.roleMaker'),
    CHECKER: t('auth.roleChecker'),
    APPROVER: t('auth.roleApprover'),
    ADMIN: t('auth.roleAdmin'),
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Logo / Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-primary-700">
            {t('app.shortTitle')}
          </h1>
        </div>

        {/* Right: User info + role switcher */}
        <div className="flex items-center gap-4">
          {/* Role switcher (dev only) */}
          <div className="flex items-center gap-2">
            <label htmlFor="role-switcher" className="text-xs text-gray-500">
              {t('nav.switchRole')}:
            </label>
            <select
              id="role-switcher"
              value={user.role}
              onChange={(e) => switchRole(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-yellow-50"
            >
              {availableUsers.map((u) => (
                <option key={u.userId} value={u.role}>
                  {roleLabels[u.role] || u.role}
                </option>
              ))}
            </select>
          </div>

          {/* User info */}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{user.userName}</p>
            <p className="text-xs text-gray-500">{user.unitName}</p>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
            aria-label={t('nav.logout')}
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
