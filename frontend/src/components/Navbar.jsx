import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Ticket, Settings, User, ScanLine } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeName, setThemeName, themes } = useTheme();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user?.role === 'admin';

  if (!user || location.pathname === '/') return null;

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <Link to="/events" className="hover:opacity-80 transition-opacity">
        <Logo size={28} textSize={18} />
      </Link>

      <div className="flex items-center gap-6">
        {/* Theme Picker */}
        <div className="flex items-center gap-2 bg-[#12161F] px-3 py-1.5 rounded-full border border-[#232838]">
          {Object.keys(themes).map((name) => (
            <button
              key={name}
              onClick={() => setThemeName(name)}
              title={`Switch to ${name} theme`}
              className={`w-4 h-4 rounded-full transition-all ${themeName === name ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`}
              style={{ background: themes[name].accent }}
            />
          ))}
        </div>

        {/* Links */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/admin' ? 'bg-[#E8B563]/10 text-[#E8B563]' : 'text-[#8B93A7] hover:text-white hover:bg-[#12161F]'}`}
              >
                <Settings size={16} />
                Admin
              </Link>
              <Link
                to="/admin/scanner"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/admin/scanner' ? 'bg-[#E8B563]/10 text-[#E8B563]' : 'text-[#8B93A7] hover:text-white hover:bg-[#12161F]'}`}
              >
                <ScanLine size={16} />
                Scanner
              </Link>
            </>
          )}

          <Link
            to="/my-bookings"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/my-bookings' ? 'bg-[#E8B563]/10 text-[#E8B563]' : 'text-[#8B93A7] hover:text-white hover:bg-[#12161F]'}`}
          >
            <Ticket size={16} />
            My Bookings
          </Link>

          <div className="h-6 w-[1px] bg-[#232838] mx-2" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8B563] to-[#C1443D] flex items-center justify-center text-[#0B0E14] font-bold text-sm">
              {user.name ? user.name[0].toUpperCase() : <User size={16} />}
            </div>
            <button
              onClick={handleLogout}
              className="text-[#8B93A7] hover:text-[#C1443D] transition-colors p-2 rounded-lg hover:bg-[#12161F]"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
