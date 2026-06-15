import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScanLine, FileDown, FileSpreadsheet, Boxes, QrCode, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';
import { api } from '../api';

function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/app/' },
    { id: 'categories', icon: Boxes, label: 'Categories', path: '/app/categories' },
    { id: 'scanner', icon: ScanLine, label: 'Scanner', path: '/app/scanner' },
  ];

  const handleExportPdf = () => {
    window.open(api.getPdfSummaryUrl(), '_blank');
  };

  const handleExportCsv = () => {
    window.open(api.getCsvExportUrl(), '_blank');
  };

  return (
    <>
      {}
      <aside className="hidden md:flex flex-col items-center py-8 px-4 fixed left-6 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl z-50 gap-8 shadow-2xl transition-all">

        {}
        <NavLink to="/" className="w-12 h-12 bg-black text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] mb-4 hover:scale-105 transition-transform cursor-pointer">
          <img src="/assets/logo.jpeg" alt="ShiftBox Logo" className="w-full h-full object-contain p-1 rounded-2xl" />
        </NavLink>

        {}
        <nav className="flex flex-col gap-6 relative">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/app/' && location.pathname.startsWith(item.path));

            return (
              <NavLink key={item.id} to={item.path} className="group relative flex items-center justify-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                  <Icon size={22} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                </div>
                {}
                <div className="absolute left-[calc(100%+1rem)] px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl whitespace-nowrap z-[60]">
                  {item.label}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {}
        <div className="w-8 h-px bg-white/10 my-2"></div>

        {}
        <div className="flex flex-col gap-6 relative">
          <button onClick={handleExportPdf} className="group relative flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all duration-300">
              <FileDown size={22} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute left-[calc(100%+1rem)] px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl whitespace-nowrap z-[60]">
              Summary PDF
            </div>
          </button>

          <button onClick={handleExportCsv} className="group relative flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all duration-300">
              <FileSpreadsheet size={22} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute left-[calc(100%+1rem)] px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl whitespace-nowrap z-[60]">
              Export CSV
            </div>
          </button>
        </div>
      </aside>

      {}
      <div className="md:hidden fixed top-0 left-0 w-full z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain p-0.5 rounded-full" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">ShiftBox</span>
        </NavLink>
        <button 
          className="text-white hover:text-gray-300 transition-colors"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
      </div>

      {}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-12">
            <NavLink to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain p-0.5 rounded-full" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-white">ShiftBox</span>
            </NavLink>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
              <X size={28} />
            </button>
          </div>

          <div className="flex flex-col gap-6 text-xl font-medium">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink 
                  key={item.id} 
                  to={item.path} 
                  className={({isActive}) => `flex items-center gap-4 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={24} /> {item.label}
                </NavLink>
              );
            })}
            <div className="w-full h-px bg-white/10 my-2"></div>
            <button onClick={() => { setMobileMenuOpen(false); handleExportPdf(); }} className="flex items-center gap-4 text-gray-400 hover:text-gray-200 text-left">
              <FileDown size={24} /> Summary PDF
            </button>
            <button onClick={() => { setMobileMenuOpen(false); handleExportCsv(); }} className="flex items-center gap-4 text-gray-400 hover:text-gray-200 text-left">
              <FileSpreadsheet size={24} /> Export CSV
            </button>
            <div className="w-full h-px bg-white/10 my-2"></div>
            <NavLink 
              to="/profile" 
              className={({isActive}) => `flex items-center gap-4 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <User size={24} /> Profile
            </NavLink>
          </div>

          <div className="mt-auto pt-8 border-t border-white/10">
            <button 
              onClick={() => { setMobileMenuOpen(false); logout(); navigate('/'); }} 
              className="bg-white/10 border border-white/20 text-white px-6 py-4 rounded-xl text-center w-full font-medium hover:bg-white/20 flex items-center justify-center gap-2"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
