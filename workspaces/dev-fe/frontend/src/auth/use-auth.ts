// ============================================================================
// useAuth hook — access auth context
// ============================================================================

import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './auth-context';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phai duoc su dung ben trong AuthProvider');
  }
  return context;
}
