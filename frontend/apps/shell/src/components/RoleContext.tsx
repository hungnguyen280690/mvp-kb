import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserRole, RoleInfo } from '../types';
import { ROLES } from '../types';

interface RoleContextType {
  role: UserRole;
  roleInfo: RoleInfo;
  setRole: (role: UserRole) => void;
  canCreate: boolean;
  canEdit: (createdBy: string) => boolean;
  canDelete: (createdBy: string) => boolean;
  canSubmit: (createdBy: string) => boolean;
  canCheck: boolean;
  canApprove: boolean;
  canReject: boolean;
}

const RoleContext = createContext<RoleContextType | null>(null);

const MOCK_USER = 'phamti16'; // current "logged in" user

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('MAKER');
  const roleInfo = ROLES.find((r) => r.role === role)!;

  const value: RoleContextType = {
    role,
    roleInfo,
    setRole,
    canCreate: role === 'MAKER' || role === 'ADMIN',
    canEdit: (createdBy: string) =>
      (role === 'MAKER' || role === 'ADMIN') && (createdBy === MOCK_USER || role === 'ADMIN'),
    canDelete: (createdBy: string) =>
      (role === 'MAKER' || role === 'ADMIN') && (createdBy === MOCK_USER || role === 'ADMIN'),
    canSubmit: (createdBy: string) =>
      (role === 'MAKER' || role === 'ADMIN') && (createdBy === MOCK_USER || role === 'ADMIN'),
    canCheck: role === 'CHECKER' || role === 'ADMIN',
    canApprove: role === 'APPROVER' || role === 'ADMIN',
    canReject: role === 'CHECKER' || role === 'APPROVER' || role === 'ADMIN',
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

export { MOCK_USER };
