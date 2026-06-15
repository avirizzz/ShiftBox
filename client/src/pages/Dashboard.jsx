import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/ToastContext';
import {
  Package, CheckCircle, Truck, ArrowDownToLine, ClipboardCheck,
  Plus, ScanLine, FileDown, Clock, Boxes, TrendingUp
} from 'lucide-react';

const STATUSES = ['Planned', 'Packed', 'Loaded', 'Unloaded', 'Verified'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      toast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div className="text-white">
        <div className="mb-8"><div className="w-48 h-8 bg-white/10 animate-pulse rounded mb-2"/><div className="w-32 h-4 bg-white/10 animate-pulse rounded"/></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-white/10 animate-pulse rounded-2xl"/>)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Boxes & Items', value: stats?.totalBoxes || 0, icon: Boxes, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Packed', value: stats?.packed || 0, icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Loaded', value: stats?.loaded || 0, icon: Truck, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Unloaded', value: stats?.unloaded || 0, icon: ArrowDownToLine, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Verified', value: stats?.verified || 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  const totalBoxes = stats?.totalBoxes || 0;
  const completedBoxes = (stats?.verified || 0);
  const progressPercent = totalBoxes > 0 ? Math.round((completedBoxes / totalBoxes) * 100) : 0;

  return (
    <div className="text-white space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-gray-400 mt-1">Home Shift — June 2026</p>
        </div>
        <div className="flex gap-3">
          <button className="liquid-glass border border-white/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2" onClick={() => navigate('/app/scanner')}>
            <ScanLine size={16} /> Scan QR
          </button>
          <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2" onClick={() => navigate('/app/categories')}>
            <Plus size={16} /> Manage Inventory
          </button>
        </div>
      </header>

      {}
      {totalBoxes > 0 && (
        <div className="liquid-glass rounded-2xl p-6">
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp size={24} className="text-white" />
              <div>
                <h3 className="text-lg font-medium">Overall Progress</h3>
                <p className="text-sm text-gray-400">{completedBoxes} of {totalBoxes} items & boxes verified</p>
              </div>
            </div>
            <span className="text-2xl font-light">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-1000 ease-out" style={{width: `${progressPercent}%`}} />
          </div>
        </div>
      )}

      {}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="liquid-glass p-5 rounded-2xl flex flex-col justify-between aspect-square md:aspect-auto md:h-32">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-semibold">{card.value}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="liquid-glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
            <ClipboardCheck size={20} />
            <h2 className="text-lg font-medium">Category Progress</h2>
          </div>
          <div className="space-y-6">
            {stats?.categoryStats?.length > 0 ? stats.categoryStats.map(cat => {
              const total = cat.total;
              const done = cat.verified;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={cat.id} className="cursor-pointer group" onClick={() => navigate(`/app/category/${cat.id}`)}>
                  <div className="flex justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{background: cat.color}} />
                      <span className="font-medium group-hover:text-gray-300 transition-colors">{cat.name}</span>
                    </div>
                    <span className="text-gray-400">{done}/{total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div className="h-full transition-all duration-1000" style={{width:`${pct}%`, background: cat.color}} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cat.packed > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 uppercase tracking-widest">{cat.packed} packed</span>}
                    {cat.loaded > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 uppercase tracking-widest">{cat.loaded} loaded</span>}
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-8 text-center">
                <Package size={32} className="mb-3 opacity-50" />
                <p>No categories yet. Create one to start tracking!</p>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="liquid-glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
            <Clock size={20} />
            <h2 className="text-lg font-medium">Recent Activity</h2>
          </div>
          {stats?.recentScans?.length > 0 ? (
            <div className="relative pl-6 border-l border-white/10 space-y-8 py-4">
              {stats.recentScans.map(scan => {
                const isVerified = scan.box_status === 'Verified';
                const isLoaded = scan.box_status === 'Loaded';
                const isPacked = scan.box_status === 'Packed';
                const colorClass = isVerified ? 'text-green-400' : isLoaded ? 'text-cyan-400' : isPacked ? 'text-amber-400' : 'text-white';

                return (
                  <div key={scan.id} className="relative cursor-pointer group" onClick={() => navigate(`/app/box/${scan.box_id}`)}>
                    <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-black border-2 border-white/20 group-hover:border-white transition-colors" />
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-gray-400">
                        <span className="text-white font-medium">{scan.box_number}</span> was scanned and marked <span className={`${colorClass} font-medium`}>{scan.box_status}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        {new Date(scan.scanned_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {scan.category_name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 py-12 text-center">
              <ScanLine size={32} className="mb-3 opacity-50" />
              <p>No activity yet. Open the scanner to start!</p>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="liquid-glass rounded-2xl p-6">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors" onClick={() => navigate('/app/categories')}>
            <Plus size={24} className="text-white" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Create Category</span>
          </button>
          <button className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors" onClick={() => navigate('/app/scanner')}>
            <ScanLine size={24} className="text-white" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Open Scanner</span>
          </button>
          <button className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors" onClick={() => window.open(api.getPdfSummaryUrl(), '_blank')}>
            <FileDown size={24} className="text-white" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Download Report</span>
          </button>
          <button className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors" onClick={() => window.open(api.getCsvExportUrl(), '_blank')}>
            <FileDown size={24} className="text-white" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
