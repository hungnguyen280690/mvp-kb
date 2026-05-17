import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

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
            <Route path="/ltt/*" element={<div id="ltt-remote" />} />
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
