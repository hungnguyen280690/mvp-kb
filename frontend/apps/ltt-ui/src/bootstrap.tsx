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
// Bootstrap — mounts the ltt-ui micro-frontend
// ---------------------------------------------------------------------------

function LttUI() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

// ---------------------------------------------------------------------------
// Mount to DOM
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
