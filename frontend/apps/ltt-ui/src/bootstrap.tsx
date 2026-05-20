import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { routes } from "./routes";

// ---------------------------------------------------------------------------
// Route renderer
// ---------------------------------------------------------------------------

function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

// ---------------------------------------------------------------------------
// LttUI — standalone version with its own BrowserRouter
// ---------------------------------------------------------------------------

function LttUI() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

// ---------------------------------------------------------------------------
// LttUIEmbedded — for embedding inside a host router (no BrowserRouter)
// ---------------------------------------------------------------------------

export function LttUIEmbedded() {
  return <AppRoutes />;
}

// ---------------------------------------------------------------------------
// Mount to DOM (standalone mode)
// ---------------------------------------------------------------------------

const rootEl =
  document.getElementById("root") ?? document.getElementById("ltt-ui-root");

if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <LttUI />
    </React.StrictMode>,
  );
}

export default LttUI;
