import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { api } from '../api';
import { LogOut, User, Mail, Shield, ArrowLeft, Lock, Boxes, Package, Truck, ArrowDownToLine, CheckCircle, Save } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [stats, setStats] = useState(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || (user ? `${user.name.toLowerCase().replace(' ', '.')}@example.com` : ''));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      api.getStats().then(setStats).catch(console.error);
    }
  }, [user]);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      return toast('Name must be at least 2 characters', 'error');
    }
    if (!email.includes('@')) {
      return toast('Please enter a valid email', 'error');
    }
    toast('Profile updated successfully', 'success');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      return toast('Please enter your current password', 'error');
    }
    if (newPassword.length < 8) {
      return toast('New password must be at least 8 characters', 'error');
    }
    toast('Password changed successfully', 'success');
    setCurrentPassword('');
    setNewPassword('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[url('/assets/mobile.png')] md:bg-[url('/assets/desktop.jpg')] bg-cover bg-center bg-fixed text-white flex items-center justify-center">
        <div className="liquid-glass p-8 rounded-2xl flex flex-col items-center">
          <Shield size={48} className="text-gray-400 mb-4" />
          <p className="text-xl font-medium mb-4">Access Denied</p>
          <p className="text-gray-400 mb-6">Please log in to view your profile.</p>
          <button onClick={() => navigate('/')} className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition">Go to Home</button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Inventory', value: stats?.totalBoxes || 0, icon: Boxes, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Packed', value: stats?.packed || 0, icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Loaded', value: stats?.loaded || 0, icon: Truck, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Unloaded', value: stats?.unloaded || 0, icon: ArrowDownToLine, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Verified', value: stats?.verified || 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="min-h-screen bg-[url('/assets/mobile.png')] md:bg-[url('/assets/desktop.jpg')] bg-cover bg-center bg-fixed text-white font-sans p-4 sm:p-6 md:p-12">
      <div className="max-w-6xl mx-auto relative z-10 animate-in fade-in duration-500 slide-in-from-bottom-4">

        {}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <button 
            onClick={() => { logout(); navigate('/'); }}
            className="bg-red-500/10 text-red-400 border border-red-500/30 px-6 py-2.5 rounded-full font-medium hover:bg-red-500/20 hover:border-red-500/50 transition-colors flex items-center gap-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-10 tracking-tight drop-shadow-lg">Your Profile</h1>

        <div className="grid lg:grid-cols-2 gap-10">

          {}
          <div className="space-y-8">
            <div className="liquid-glass rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/10">
                <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  <User size={40} className="text-white/80" />
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">{user.name}</h2>
                  <p className="text-white/60 mt-1">{email}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <h3 className="text-xl font-medium mb-4 flex items-center gap-2"><User size={20}/> Personal Details</h3>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Full Name</label>
                  <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Email Address</label>
                  <input type="email" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors mt-2 flex justify-center items-center gap-2">
                  <Save size={18} /> Update Details
                </button>
              </form>
            </div>

            <div className="liquid-glass rounded-3xl p-8 border border-white/10 shadow-2xl">
              <form onSubmit={handleChangePassword} className="space-y-5">
                <h3 className="text-xl font-medium mb-4 flex items-center gap-2"><Lock size={20}/> Change Password</h3>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <button type="submit" className="w-full bg-white/10 border border-white/20 text-white py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors mt-2">
                  Update Password
                </button>
              </form>
            </div>
          </div>

          {}
          <div className="space-y-8">
            <div className="liquid-glass rounded-3xl p-8 border border-white/10 shadow-2xl h-full flex flex-col">
              <h3 className="text-2xl font-semibold mb-2">Your Statistics</h3>
              <p className="text-white/50 mb-8">An overview of all your inventory and tracking progress.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {statCards.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className={`p-6 rounded-2xl border border-white/5 bg-black/20 flex flex-col justify-between ${idx === 0 ? 'sm:col-span-2' : ''}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                          <Icon size={24} className={stat.color} />
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                        <div className="text-sm font-medium text-white/50 uppercase tracking-wider">{stat.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
