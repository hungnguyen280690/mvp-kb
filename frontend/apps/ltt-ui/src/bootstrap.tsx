/// <reference types="vite/client" />
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";

// Lazy-loaded pages (will be implemented in FE-T9)
const PayOutManualListPage = React.lazy(
  () => import("./pages/PayOutManualListPage"),
);
const PayOutManualFormPage = React.lazy(
  () => import("./pages/PayOutManualFormPage"),
);
const PayOutManualDetailPage = React.lazy(
  () => import("./pages/PayOutManualDetailPage"),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function LttUI() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename="/ltt">
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center h-screen">
                Đang tải...
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/pay-out-manual" replace />}
              />
              <Route
                path="/pay-out-manual"
                element={<PayOutManualListPage />}
              />
              <Route
                path="/pay-out-manual/new"
                element={<PayOutManualFormPage />}
              />
              <Route
                path="/pay-out-manual/:id"
                element={<PayOutManualDetailPage />}
              />
              <Route
                path="/pay-out-manual/:id/edit"
                element={<PayOutManualFormPage />}
              />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
