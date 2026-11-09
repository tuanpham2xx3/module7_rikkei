import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppHeader } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { LoginPage } from './pages/LoginPage';
import { TimelinePage } from './pages/TimelinePage';
import { ProfilePage } from './pages/ProfilePage';

// App Shell Layout for Protected Pages
const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1c1917]">
      <AppHeader />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

// Write Page Placeholder (To be fully implemented in Task A04)
const WritePlaceholder: React.FC = () => {
  return (
    <div className="doodle-box p-8 bg-white border-2 border-stone-800 text-center max-w-lg mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-[#fef08a] border-2 border-stone-800 flex items-center justify-center mx-auto mb-4 text-3xl">
        ✍️
      </div>
      <h2 className="font-doodle text-3xl font-bold text-stone-900 mb-2">
        Khu vực Ghi nhật ký (Task A04)
      </h2>
      <p className="text-sm text-stone-600 mb-6">
        Khung ứng dụng và phiên đăng nhập đã sẵn sàng. Form ghi nhật ký 1–300 ký tự sẽ được triển khai ngay ở Task tiếp theo!
      </p>
      <a
        href="/"
        className="doodle-btn bg-[#1c1917] text-white py-2.5 px-6 rounded-xl font-bold shadow-doodle"
      >
        Quay lại Hành trình
      </a>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<TimelinePage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/write" element={<WritePlaceholder />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
