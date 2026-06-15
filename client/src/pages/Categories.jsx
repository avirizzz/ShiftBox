import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/ToastContext';
import {
  Plus, Package, Boxes, Trash2, Printer, ChevronRight, X, MonitorSmartphone, Pencil
} from 'lucide-react';

const PRESET_COLORS = ['#e63946','#457b9d','#f4a261','#2a9d8f','#9b5de5','#e07a5f','#81b29a','#f2cc8f','#264653','#ef476f'];

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', color: '#e63946', description: '' });
  const [editModal, setEditModal] = useState(null);
  const [genModal, setGenModal] = useState(null);
  const [genCount, setGenCount] = useState(12);
  const [itemModal, setItemModal] = useState(null);
  const [itemName, setItemName] = useState('');
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch { toast('Failed to load categories', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    try {
      await api.createCategory(newCat);
      toast(`Created "${newCat.name}" category`, 'success');
      setNewCat({ name: '', color: '#e63946', description: '' });
      setShowCreate(false);
      fetchCategories();
    } catch { toast('Failed to create category', 'error'); }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editModal.name.trim()) return;
    try {
      await api.updateCategory(editModal.id, {
        name: editModal.name,
        color: editModal.color,
        description: editModal.description
      });
      toast(`Updated "${editModal.name}"`, 'success');
      setEditModal(null);
      fetchCategories();
    } catch { toast('Failed to update category', 'error'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its boxes?`)) return;
    try {
      await api.deleteCategory(id);
      toast(`Deleted "${name}"`, 'success');
      fetchCategories();
    } catch { toast('Failed to delete', 'error'); }
  };

  const handleGenerate = async () => {
    if (!genModal) return;
    setGenerating(true);
    try {
      const boxes = await api.generateBoxes(genModal.categoryId, genCount);
      toast(`Generated ${boxes.length} boxes for ${genModal.categoryName}`, 'success');
      setGenModal(null);
      setGenCount(12);
      fetchCategories();
    } catch { toast('Failed to generate boxes', 'error'); }
    finally { setGenerating(false); }
  };

  const handleCreateItem = async () => {
    if (!itemModal || !itemName.trim()) return;
    setGenerating(true);
    try {
      await api.createStandaloneItem(itemModal.categoryId, itemName.trim());
      toast(`Added item "${itemName}" to ${itemModal.categoryName}`, 'success');
      setItemModal(null);
      setItemName('');
      fetchCategories();
    } catch { toast('Failed to add item', 'error'); }
    finally { setGenerating(false); }
  };

  const handlePrintLabels = (categoryId) => {
    window.open(api.getPdfLabelsUrl(categoryId), '_blank');
  };

  if (loading) {
    return (
      <div className="text-white animate-pulse">
        <div className="h-10 w-48 bg-white/10 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white/10 rounded-2xl"/>)}
        </div>
      </div>
    );
  }

  return (
    <div className="text-white animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
          <p className="text-gray-400 mt-1">{categories.length} categories · {categories.reduce((s,c) => s + c.total_boxes, 0)} total items & boxes</p>
        </div>
        <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Category
        </button>
      </header>

      {categories.length === 0 ? (
        <div className="liquid-glass rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <Boxes size={48} className="text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">No categories yet</h3>
          <p className="text-gray-400 mb-6 max-w-sm">Create your first category like Kitchen, Bedroom, or Documents to start generating boxes and items.</p>
          <button className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map(cat => {
            const total = cat.total_boxes;
            const verified = cat.verified;
            const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
            return (
              <div key={cat.id} className="liquid-glass rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-shadow border border-white/5">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shadow-inner" style={{background: cat.color}} />
                      <h3 className="text-xl font-medium">{cat.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="text-gray-500 hover:text-white transition-colors p-1" title="Edit" onClick={() => setEditModal(cat)}>
                        <Pencil size={16} />
                      </button>
                      <button className="text-gray-500 hover:text-red-400 transition-colors p-1" title="Delete" onClick={() => handleDelete(cat.id, cat.name)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {cat.description && <p className="text-sm text-gray-400 mb-6">{cat.description}</p>}

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="flex flex-col"><span className="text-lg font-semibold">{total}</span><span className="text-[10px] text-gray-500 uppercase tracking-widest">Total</span></div>
                    <div className="flex flex-col"><span className="text-lg font-semibold text-amber-500">{cat.packed}</span><span className="text-[10px] text-gray-500 uppercase tracking-widest">Packed</span></div>
                    <div className="flex flex-col"><span className="text-lg font-semibold text-cyan-500">{cat.loaded}</span><span className="text-[10px] text-gray-500 uppercase tracking-widest">Loaded</span></div>
                    <div className="flex flex-col"><span className="text-lg font-semibold text-green-500">{verified}</span><span className="text-[10px] text-gray-500 uppercase tracking-widest">Verified</span></div>
                  </div>

                  {total > 0 && (
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
                      <div className="h-full transition-all duration-500" style={{width:`${pct}%`, background: cat.color}} />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10 mt-auto">
                  {total === 0 ? (
                    <>
                      <button className="flex-1 bg-white text-black px-3 py-2 rounded text-xs font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2" onClick={() => setGenModal({ categoryId: cat.id, categoryName: cat.name })}>
                        <Boxes size={14} /> Generate Boxes
                      </button>
                      <button className="flex-1 bg-white/10 border border-white/20 text-white px-3 py-2 rounded text-xs font-medium hover:bg-white/20 transition flex items-center justify-center gap-2" onClick={() => setItemModal({ categoryId: cat.id, categoryName: cat.name })}>
                        <MonitorSmartphone size={14} /> Add Item
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex-1 bg-white/10 border border-white/20 text-white px-3 py-2 rounded text-xs font-medium hover:bg-white/20 transition flex items-center justify-center gap-2" onClick={() => setGenModal({ categoryId: cat.id, categoryName: cat.name })}>
                        <Plus size={14} /> Add Boxes
                      </button>
                      <button className="flex-1 bg-white/10 border border-white/20 text-white px-3 py-2 rounded text-xs font-medium hover:bg-white/20 transition flex items-center justify-center gap-2" onClick={() => setItemModal({ categoryId: cat.id, categoryName: cat.name })}>
                        <MonitorSmartphone size={14} /> Add Item
                      </button>
                      <button className="flex-1 bg-white/10 border border-white/20 text-white px-3 py-2 rounded text-xs font-medium hover:bg-white/20 transition flex items-center justify-center gap-2" onClick={() => handlePrintLabels(cat.id)}>
                        <Printer size={14} /> Labels PDF
                      </button>
                    </>
                  )}
                  <button className="w-full mt-2 bg-transparent border border-white/20 text-white px-3 py-2 rounded text-xs font-medium hover:bg-white/10 transition flex items-center justify-center gap-2" onClick={() => navigate(`/app/category/${cat.id}`)}>
                    View All <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="liquid-glass w-full max-w-md p-6 rounded-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">New Category</h2>
              <button className="text-gray-400 hover:text-white" onClick={() => setShowCreate(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Category Name</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40" placeholder="e.g. Kitchen, Bedroom" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} autoFocus />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Color Tag</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" className={`w-8 h-8 rounded-full border-2 transition-all ${newCat.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{background: c}} onClick={() => setNewCat({...newCat, color: c})} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Description (optional)</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40" placeholder="What goes in this category?" value={newCat.description} onChange={e => setNewCat({...newCat, description: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                <button type="button" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition" disabled={!newCat.name.trim()}>Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditModal(null)}>
          <div className="liquid-glass w-full max-w-md p-6 rounded-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">Edit Category</h2>
              <button className="text-gray-400 hover:text-white" onClick={() => setEditModal(null)}><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Category Name</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40" placeholder="e.g. Kitchen, Bedroom" value={editModal.name} onChange={e => setEditModal({...editModal, name: e.target.value})} autoFocus />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Color Tag</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" className={`w-8 h-8 rounded-full border-2 transition-all ${editModal.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{background: c}} onClick={() => setEditModal({...editModal, color: c})} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Description (optional)</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40" placeholder="What goes in this category?" value={editModal.description || ''} onChange={e => setEditModal({...editModal, description: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                <button type="button" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition" disabled={!editModal.name.trim()}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {genModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setGenModal(null)}>
          <div className="liquid-glass w-full max-w-md p-6 rounded-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">Generate Boxes</h2>
              <button className="text-gray-400 hover:text-white" onClick={() => setGenModal(null)}><X size={20}/></button>
            </div>
            <p className="text-gray-300 mb-6">Generate QR-labeled boxes for <strong>{genModal.categoryName}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Number of Boxes</label>
                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40" min="1" max="100" value={genCount} onChange={e => setGenCount(parseInt(e.target.value) || 12)} />
              </div>
              <div className="flex gap-2">
                {[6, 12, 24].map(n => (
                  <button key={n} type="button" className={`flex-1 py-2 rounded-lg text-sm transition-colors ${genCount === n ? 'bg-white/20 border border-white/40 text-white' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`} onClick={() => setGenCount(n)}>{n} boxes</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition" onClick={() => setGenModal(null)}>Cancel</button>
              <button className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating...' : `Generate ${genCount} Boxes`}
              </button>
            </div>
          </div>
        </div>
      )}

      {itemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setItemModal(null)}>
          <div className="liquid-glass w-full max-w-md p-6 rounded-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">Add Standalone Item</h2>
              <button className="text-gray-400 hover:text-white" onClick={() => setItemModal(null)}><X size={20}/></button>
            </div>
            <p className="text-gray-300 mb-6">Add a standalone item (e.g. Bed, TV) for <strong>{itemModal.categoryName}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Item Name</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40" placeholder="e.g. Samsung TV" value={itemName} onChange={e => setItemName(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition" onClick={() => setItemModal(null)}>Cancel</button>
              <button className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition" onClick={handleCreateItem} disabled={generating || !itemName.trim()}>
                {generating ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;
