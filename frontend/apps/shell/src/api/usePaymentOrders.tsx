import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { PaymentOrderListItem, PaymentOrderStatus } from '../types';
import { mockPaymentOrders as initialOrders } from './mockData';

interface StoreContextType {
  orders: PaymentOrderListItem[];
  getOrder: (id: string) => PaymentOrderListItem | undefined;
  transitionStatus: (id: string, newStatus: PaymentOrderStatus) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function PaymentOrderStoreProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<PaymentOrderListItem[]>(initialOrders);

  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders],
  );

  const transitionStatus = useCallback((id: string, newStatus: PaymentOrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: newStatus, version: o.version + 1 }
          : o,
      ),
    );
  }, []);

  return (
    <StoreContext.Provider value={{ orders, getOrder, transitionStatus }}>
      {children}
    </StoreContext.Provider>
  );
}

export function usePaymentOrders() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('usePaymentOrders must be used within PaymentOrderStoreProvider');
  return ctx;
}
