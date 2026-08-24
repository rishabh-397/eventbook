import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import EventsPage from './pages/EventsPage';
import SeatMapPage from './pages/SeatMapPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminScannerPage from './pages/AdminScannerPage';
import ChatWidget from './components/ChatWidget';
import Navbar from './components/Navbar';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0B0E14] text-[#EDEAE3] font-body flex flex-col relative overflow-hidden">
        <Navbar />
        <ChatWidget />
        <main className="flex-1 w-full relative z-10">
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id"
              element={
                <ProtectedRoute>
                  <SeatMapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/scanner"
              element={
                <ProtectedRoute>
                  <AdminScannerPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}