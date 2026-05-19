import { BrowserRouter, Routes, Route } from "react-router-dom";

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#073763]">VDBAS - MVP Kho Bạc</h1>
      <p className="mt-4 text-gray-600">
        Hệ thống đang được khởi tạo. Vui lòng thực hiện theo quy trình 4 giai
        đoạn để phát triển tính năng.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<div>404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
