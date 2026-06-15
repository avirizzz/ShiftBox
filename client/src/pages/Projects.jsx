import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/ToastContext';
import { Plus, Home, ChevronRight, X, Calendar, Edit2, Trash2, Save } from 'lucide-react';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [editingProject, setEditingProject] = useState(null);
  const [editData, setEditData] = useState({ name: '', description: '' });
  const navigate = useNavigate();
  const toast = useToast();

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch {
      toast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    try {
      await api.createProject(newProject);
      toast(`Created "${newProject.name}"`, 'success');
      setNewProject({ name: '', description: '' });
      setShowCreate(false);
      fetchProjects();
    } catch { toast('Failed to create project', 'error'); }
  };

  const handleUpdateProject = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.updateProject(id, editData);
      toast('Shift updated', 'success');
      setEditingProject(null);
      fetchProjects();
    } catch { toast('Failed to update shift', 'error'); }
  };

  const handleDeleteProject = async (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this shift? All categories and boxes inside it will be permanently deleted.')) {
      try {
        await api.deleteProject(id);
        toast('Shift deleted', 'success');
        fetchProjects();
      } catch { toast('Failed to delete shift', 'error'); }
    }
  };

  const startEdit = (e, proj) => {
    e.stopPropagation();
    setEditingProject(proj.id);
    setEditData({ name: proj.name, description: proj.description });
  };

  const handleSelectProject = (projectId) => {
    navigate('/app');
  };

  if (loading) {
    return (
      <div className="text-white animate-pulse">
        <div className="h-10 w-48 bg-white/10 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-48 bg-white/10 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="text-white animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Shifts</h1>
          <p className="text-gray-400 mt-1">Manage all your moving projects</p>
        </div>
        <button
          className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} /> New Shift
        </button>
      </header>

      {projects.length === 0 ? (
        <div className="liquid-glass rounded-2xl flex flex-col items-center justify-center py-20 text-center border border-white/5">
          <Home size={48} className="text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">No active shifts</h3>
          <p className="text-gray-400 mb-6 max-w-sm">Create your first moving project to start generating boxes and labels.</p>
          <button
            className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} /> Start a Shift
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(proj => (
            <div
              key={proj.id}
              onClick={() => handleSelectProject(proj.id)}
              className="liquid-glass rounded-2xl p-6 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer flex flex-col group relative overflow-hidden"
            >
              <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none">
                <Home size={120} />
              </div>
              {editingProject === proj.id ? (
                <div onClick={e => e.stopPropagation()} className="relative z-10 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <input 
                      value={editData.name} 
                      onChange={e => setEditData({...editData, name: e.target.value})}
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xl font-medium w-[80%] focus:outline-none"
                      autoFocus
                    />
                    <button onClick={(e) => handleUpdateProject(e, proj.id)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200">
                      <Save size={16} />
                    </button>
                  </div>
                  <textarea 
                    value={editData.description} 
                    onChange={e => setEditData({...editData, description: e.target.value})}
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm w-full mt-2 focus:outline-none resize-none"
                    rows={2}
                  />
                  <div className="mt-4 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditingProject(null); }} className="text-xs text-gray-400 hover:text-white px-2 py-1">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2 relative z-10 w-full">
                    <h3 className="text-2xl font-medium tracking-tight pr-8">{proj.name}</h3>
                    <div className="flex gap-2">
                      <button onClick={(e) => startEdit(e, proj)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => handleDeleteProject(e, proj.id)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {proj.description && <p className="text-gray-400 text-sm mb-6 relative z-10">{proj.description}</p>}
                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-gray-500 relative z-10 w-full">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} /> 
                      Created {new Date(proj.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-white/50 group-hover:text-white transition-colors">
                      Enter <ChevronRight size={14} />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="liquid-glass w-full max-w-md p-6 rounded-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">Start New Shift</h2>
              <button className="text-gray-400 hover:text-white" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Project Name</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                  placeholder="e.g. Moving to Seattle"
                  value={newProject.name}
                  onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Description (optional)</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40 resize-none h-24"
                  placeholder="Summer 2026 relocation..."
                  value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                <button type="button" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition" disabled={!newProject.name.trim()}>Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
