import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LttListPage from "../../ltt-ui/src/pages/LttListPage";
import LttFormPage from "../../ltt-ui/src/pages/LttFormPage";
import LttViewPage from "../../ltt-ui/src/pages/LttViewPage";
import LttCheckPage from "../../ltt-ui/src/pages/LttCheckPage";
import LttApprovePage from "../../ltt-ui/src/pages/LttApprovePage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex gap-6">
            <Link to="/" className="font-semibold text-gray-800">
              MVP Kho Bac
            </Link>
            <Link to="/ltt" className="text-gray-600 hover:text-gray-900">
              Lenh Thanh Toan
            </Link>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ltt" element={<LttListPage />} />
            <Route path="/ltt/new" element={<LttFormPage />} />
            <Route path="/ltt/:id" element={<LttViewPage />} />
            <Route path="/ltt/:id/edit" element={<LttFormPage />} />
            <Route path="/ltt/:id/check" element={<LttCheckPage />} />
            <Route path="/ltt/:id/approve" element={<LttApprovePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold">MVP Kho Bac</h1>
      <p className="mt-2 text-gray-600">He thong Quan ly Kho Bac Nha Nuoc</p>
    </div>
  );
}
