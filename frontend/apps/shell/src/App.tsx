import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { PayOutManualList } from "../../ltt-ui/src/pages/PayOutManualList";
import { PayOutManualCreate } from "../../ltt-ui/src/pages/PayOutManualCreate";
import { PayOutManualView } from "../../ltt-ui/src/pages/PayOutManualView";
import { PayOutManualEdit } from "../../ltt-ui/src/pages/PayOutManualEdit";
import { PayOutManualApprove } from "../../ltt-ui/src/pages/PayOutManualApprove";

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#073763]">VDBAS - MVP Kho Bạc</h1>
      <nav className="mt-6 space-y-2">
        <Link
          to="/pay-out-manual"
          className="block rounded-lg border border-blue-200 bg-blue-50 px-6 py-4 text-blue-800 hover:bg-blue-100 transition-colors"
        >
          <span className="font-semibold">Lệnh thanh toán</span>
          <span className="block text-sm text-blue-600">
            Quản lý lệnh thanh toán ra bằng tay
          </span>
        </Link>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pay-out-manual" element={<PayOutManualList />} />
        <Route path="/pay-out-manual/create" element={<PayOutManualCreate />} />
        <Route path="/pay-out-manual/:id" element={<PayOutManualView />} />
        <Route path="/pay-out-manual/:id/edit" element={<PayOutManualEdit />} />
        <Route
          path="/pay-out-manual/:id/approve"
          element={<PayOutManualApprove />}
        />
        <Route path="*" element={<div>404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
