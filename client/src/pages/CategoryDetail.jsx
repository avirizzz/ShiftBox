import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/ToastContext';
import {
  ArrowLeft, Package, CheckSquare, Square, QrCode, StickyNote,
  Printer, Copy, Trash2, MonitorSmartphone
} from 'lucide-react';

const STATUSES = ['Planned', 'Packed', 'Loaded', 'Unloaded', 'Verified'];

function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [boxes, setBoxes] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selected, setSelected] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const fetchData = async () => {
    try {
      const [boxData, catData] = await Promise.all([
        api.getBoxes(id),
        api.getCategories()
      ]);
      setBoxes(boxData);
      const cat = catData.find(c => c.id === id);
      setCategory(cat);
    } catch { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const filteredBoxes = filterStatus === 'All' ? boxes : boxes.filter(b => b.status === filterStatus);

  const toggleSelect = (boxId) => {
    const next = new Set(selected);
    next.has(boxId) ? next.delete(boxId) : next.add(boxId);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === filteredBoxes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredBoxes.map(b => b.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      await api.bulkDeleteBoxes([...selected]);
      toast(`Deleted ${selected.size} boxes`, 'success');
      setSelected(new Set());
      setSelectMode(false);
      fetchData();
    } catch { toast('Bulk delete failed', 'error'); }
  };

  const copyBoxCode = (code) => {
    navigator.clipboard.writeText(code);
    toast(`Copied: ${code}`, 'info');
  };

  if (loading) {
    return (
      <div className="text-white animate-pulse">
        <div className="h-10 w-48 bg-white/10 rounded mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-white/10 rounded-2xl"/>)}
        </div>
      </div>
    );
  }

  return (
    <div className="text-white animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors" onClick={() => navigate('/app/categories')}><ArrowLeft size={20}/></button>
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded shadow-inner" style={{background: category?.color}} />
              <h1 className="text-3xl font-semibold tracking-tight">{category?.name || 'Category'}</h1>
            </div>
            <p className="text-gray-400 mt-1">{boxes.length} boxes & items</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center gap-2" onClick={() => window.open(api.getPdfLabelsUrl(id), '_blank')}>
            <Printer size={16}/> Print Labels
          </button>
          <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${selectMode ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'}`}
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}>
            <CheckSquare size={16}/> {selectMode ? 'Cancel' : 'Select'}
          </button>
        </div>
      </header>

      {}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {['All', ...STATUSES].map(s => (
            <button key={s}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${filterStatus === s ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setFilterStatus(s)}>
              {s} {s !== 'All' && <span className="ml-1 opacity-70">
                ({boxes.filter(b => s === 'All' || b.status === s).length})
              </span>}
            </button>
          ))}
        </div>
      </div>

      {}
      {selectMode && selected.size > 0 && (
        <div className="liquid-glass rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4 animate-in slide-in-from-top-4 border border-white/20">
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-gray-300 hover:text-white" onClick={selectAll}>
              {selected.size === filteredBoxes.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm px-2 py-1 bg-white/10 rounded">{selected.size} selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2" onClick={handleBulkDelete}>
              <Trash2 size={16} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {}
      {filteredBoxes.length === 0 ? (
        <div className="liquid-glass rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <Package size={48} className="text-gray-400 mb-4 opacity-50" />
          <p className="text-gray-400">No boxes or items {filterStatus !== 'All' ? `with status "${filterStatus}"` : 'in this category yet'}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredBoxes.map(box => (
            <div key={box.id}
              className={`liquid-glass rounded-2xl p-4 flex flex-col cursor-pointer transition-all border ${selected.has(box.id) ? 'border-red-500 bg-red-500/10' : 'border-white/5 hover:bg-white/10'}`}
              onClick={() => selectMode ? toggleSelect(box.id) : navigate(`/app/box/${box.id}`)}>

              {selectMode && (
                <div className="mb-3 flex justify-end">
                  {selected.has(box.id) ? <CheckSquare size={20} className="text-red-500"/> : <Square size={20} className="text-gray-500"/>}
                </div>
              )}

              <div className="flex justify-between items-start mb-2">
                {box.is_standalone ? (
                  <div className="flex items-center gap-2">
                    <MonitorSmartphone size={18} className="text-gray-300" />
                    <span className="font-semibold text-sm truncate max-w-[100px]">{box.box_number}</span>
                  </div>
                ) : (
                  <span className="font-semibold">{box.box_number}</span>
                )}
                <span className={`status-chip status-${box.status.toLowerCase()}`}>{box.status}</span>
              </div>

              {box.notes && (
                <div className="flex items-start gap-1.5 text-xs text-gray-400 mt-2 line-clamp-2">
                  <StickyNote size={12} className="shrink-0 mt-0.5" />
                  <span>{box.notes}</span>
                </div>
              )}

              <div className="flex justify-between mt-auto pt-4 border-t border-white/10">
                <button className="text-gray-500 hover:text-white p-1" title="Copy box code" onClick={(e) => { e.stopPropagation(); copyBoxCode(box.box_number); }}>
                  <Copy size={14}/>
                </button>
                <button className="text-gray-500 hover:text-white p-1" title="View QR" onClick={(e) => { e.stopPropagation(); navigate(`/app/box/${box.id}`); }}>
                  <QrCode size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryDetail;
