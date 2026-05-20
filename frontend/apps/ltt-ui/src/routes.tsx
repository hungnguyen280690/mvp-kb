import type { RouteObject } from "react-router-dom";
import { PayOutManualList } from "./pages/PayOutManualList";
import { PayOutManualCreate } from "./pages/PayOutManualCreate";
import { PayOutManualView } from "./pages/PayOutManualView";
import { PayOutManualEdit } from "./pages/PayOutManualEdit";
import { PayOutManualApprove } from "./pages/PayOutManualApprove";

// ---------------------------------------------------------------------------
// React Router v6 route configuration
// ---------------------------------------------------------------------------

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <PayOutManualList />,
  },
  {
    path: "/create",
    element: <PayOutManualCreate />,
  },
  {
    path: "/:id",
    element: <PayOutManualView />,
  },
  {
    path: "/:id/edit",
    element: <PayOutManualEdit />,
  },
  {
    path: "/:id/approve",
    element: <PayOutManualApprove />,
  },
];

export default routes;
