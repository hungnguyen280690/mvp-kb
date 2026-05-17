import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LttListPage from './pages/LttListPage';
import LttFormPage from './pages/LttFormPage';
import LttViewPage from './pages/LttViewPage';
import LttApprovePage from './pages/LttApprovePage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LttListPage />} />
          <Route path="/new" element={<LttFormPage />} />
          <Route path="/:id" element={<LttViewPage />} />
          <Route path="/:id/edit" element={<LttFormPage />} />
          <Route path="/:id/approve" element={<LttApprovePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
