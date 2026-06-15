import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/ToastContext';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ArrowLeft, QrCode, Clock, StickyNote, Copy, Download,
  Package, Truck, ArrowDownToLine, CheckCircle, Circle, Save,
  Image as ImageIcon, Camera, CameraOff, X, CheckSquare, Square, Hash
} from 'lucide-react';

const STATUSES = ['Planned', 'Packed', 'Loaded', 'Unloaded', 'Verified'];
const VERIFY_STATUSES = ['Packed', 'Loaded', 'Unloaded', 'Verified'];

const STATUS_ICONS = {
  Planned: Circle,
  Packed: Package,
  Loaded: Truck,
  Unloaded: ArrowDownToLine,
  Verified: CheckCircle,
};

const STATUS_COLORS = {
  Packed: 'text-orange-400',
  Loaded: 'text-cyan-400',
  Unloaded: 'text-purple-400',
  Verified: 'text-green-400',
};

function BoxDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [box, setBox] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);

  const [totalItems, setTotalItems] = useState('');
  const [editingTotal, setEditingTotal] = useState(false);

  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Scanner State
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const html5QrRef = useRef(null);

  const fetchBox = async () => {
    try {
      const [boxData, qr] = await Promise.all([
        api.getBox(id),
        api.getQR(id)
      ]);
      setBox(boxData);
      setNotes(boxData.notes || '');
      setTotalItems(boxData.total_items?.toString() || '');
      setQrData(qr);
    } catch {
      toast('Box not found', 'error');
      navigate('/app/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBox(); }, [id]);

  useEffect(() => {
    return () => {
      if (html5QrRef.current) html5QrRef.current.stop().catch(()=>{});
    };
  }, []);

  const handleStatusChange = async (newStatus) => {
    if (!box || box.status === newStatus || updating) return;
    setUpdating(true);
    try {
      const updated = await api.updateBox(id, { status: newStatus });
      setBox(prev => ({ ...prev, ...updated, status_history: prev.status_history }));
      toast(`Status updated to ${newStatus}`, 'success');
      fetchBox();
    } catch { toast('Failed to update status', 'error'); }
    finally { setUpdating(false); }
  };

  const handleSaveNotes = async () => {
    try {
      await api.updateBox(id, { notes });
      setBox(prev => ({ ...prev, notes }));
      setEditingNotes(false);
      toast('Notes saved', 'success');
    } catch { toast('Failed to save notes', 'error'); }
  };

  const handleSaveTotalItems = async () => {
    const num = parseInt(totalItems, 10);
    if (isNaN(num) || num < 0) {
      toast('Invalid total items', 'error');
      return;
    }
    try {
      await api.updateBox(id, { total_items: num });
      setBox(prev => ({ ...prev, total_items: num }));
      setEditingTotal(false);
      toast('Total items saved', 'success');
    } catch { toast('Failed to save items count', 'error'); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        await api.updateBox(id, { image_data: base64String });
        setBox(prev => ({ ...prev, image_data: base64String }));
        toast(`${box.is_standalone ? 'Item' : 'Box'} photo uploaded`, 'success');
      } catch {
        toast('Failed to upload photo', 'error');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startVerification = async (newStatus) => {
    if (!box || box.status === newStatus || updating) return;

    setVerifyStatus(newStatus);
    setVerifying(true);
    setCameraError(null);

    setTimeout(async () => {
      try {
        const html5Qr = new Html5Qrcode("qr-verifier");
        html5QrRef.current = html5Qr;

        await html5Qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          (decodedText) => onVerifySuccess(decodedText, newStatus),
          () => {} 
        );
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError('Camera access denied. Check permissions.');
      }
    }, 100);
  };

  const stopVerification = async () => {
    try {
      if (html5QrRef.current) {
        await html5QrRef.current.stop();
        html5QrRef.current = null;
      }
    } catch {}
    setVerifying(false);
    setVerifyStatus(null);
  };

  const onVerifySuccess = async (decodedText, newStatus) => {
    await stopVerification();
    new Audio('/assets/scansound.mp3').play().catch(console.error);

    let scannedBoxId = null;
    try {
      if (decodedText.includes('/box/')) {
        scannedBoxId = decodedText.split('/box/')[1].split('/')[0].split('?')[0];
      } else {
        try {
          const parsed = JSON.parse(decodedText);
          scannedBoxId = parsed.boxId || parsed.id;
        } catch {
          scannedBoxId = decodedText.trim();
        }
      }
    } catch {
      scannedBoxId = null;
    }

    if (scannedBoxId !== box.id) {
      toast(`Verification failed: Wrong ${box.is_standalone ? 'item' : 'box'} scanned!`, 'error');
      return;
    }

    toast('Verification passed', 'success');
    handleStatusChange(newStatus);
  };

  const copyBoxCode = () => {
    navigator.clipboard.writeText(box.box_number);
    toast(`Copied: ${box.box_number}`, 'info');
  };

  const downloadQR = () => {
    if (!qrData?.qr) return;
    const link = document.createElement('a');
    link.download = `${box.box_number}-qr.png`;
    link.href = qrData.qr;
    link.click();
    toast('QR downloaded', 'success');
  };

  if (loading) {
    return (
      <div className="text-white animate-pulse">
        <div className="h-10 w-48 bg-white/10 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-white/10 rounded-2xl" />
          <div className="h-96 bg-white/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!box) return null;

  const currentIdx = STATUSES.indexOf(box.status);

  return (
    <div className="text-white animate-in fade-in duration-500 max-w-6xl mx-auto pb-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors" onClick={() => navigate(-1)}><ArrowLeft size={20}/></button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">{box.box_number}</h1>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded shadow-inner" style={{background: box.category_color}}/>
              <span className="text-gray-400 font-medium">{box.category_name}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center gap-2" onClick={copyBoxCode}>
            <Copy size={16}/> Copy Code
          </button>
          <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2" onClick={downloadQR}>
            <Download size={16}/> Download QR
          </button>
        </div>
      </header>

      {verifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="liquid-glass rounded-2xl p-6 border border-white/10 max-w-md w-full flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-medium text-white mb-2">Verify {box.is_standalone ? 'Item' : 'Box'}</h3>
            <p className="text-gray-400 text-center text-sm mb-6">Scan {box.box_number}'s QR code to mark it as <span className="text-white font-bold">{verifyStatus}</span></p>

            <div className="w-full bg-black rounded-xl overflow-hidden mb-6 relative min-h-[300px] flex items-center justify-center">
              <div id="qr-verifier" className="w-full [&>video]:w-full [&>video]:object-cover" />
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/80">
                  <CameraOff size={32} className="text-red-500 mb-2" />
                  <p className="text-sm text-gray-300">{cameraError}</p>
                </div>
              )}
            </div>

            <button className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2" onClick={stopVerification}>
              <X size={16} /> Cancel Verification
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">

          {/* Quick Checkboxes for Verification */}
          <div className="liquid-glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Quick Verification</h3>
            <div className="flex flex-col gap-3">
              {VERIFY_STATUSES.map((s) => {
                const stepIdx = STATUSES.indexOf(s);
                const isCompleted = currentIdx >= stepIdx;
                const isNext = currentIdx === stepIdx - 1;
                const canCheck = isNext && !updating;

                return (
                  <button key={s} 
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCompleted ? 'bg-white/10 border-white/20 opacity-70 cursor-default' : canCheck ? 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer' : 'bg-transparent border-transparent opacity-30 cursor-not-allowed'}`}
                    onClick={() => { if (canCheck) startVerification(s); }}
                    disabled={!canCheck}>
                    <div className={isCompleted ? STATUS_COLORS[s] : 'text-gray-500'}>
                      {isCompleted ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <span className={`font-medium ${isCompleted ? 'text-white' : 'text-gray-400'}`}>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Status */}
          <div className="liquid-glass rounded-2xl p-6 border border-white/5 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-300">Current Status</h3>
            <span className={`status-chip status-${box.status.toLowerCase()} px-4 py-1.5 text-sm`}>
              {box.status}
            </span>
          </div>

          {}
          <div className="liquid-glass rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium text-gray-300 w-full text-left mb-6">{box.image_data ? (box.is_standalone ? 'Item Photo' : 'Box Photo') : 'QR Code Identity'}</h3>

            <div className="relative overflow-hidden group w-full flex flex-col items-center">
              {box.image_data ? (
                 <div className="w-full relative rounded-xl overflow-hidden mb-4 shadow-2xl">
                   <img src={box.image_data} alt="Box" className="w-full h-auto object-cover" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <button className="bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-md text-sm font-medium hover:bg-white/30 transition flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                       <Camera size={16}/> Retake Photo
                     </button>
                   </div>
                 </div>
              ) : (
                <div className="bg-white p-4 rounded-xl shadow-lg mb-6 hover:scale-105 transition-transform duration-300">
                  {qrData?.qr ? <img src={qrData.qr} alt={`QR for ${box.box_number}`} className="w-48 h-48 object-contain mix-blend-multiply" /> : <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center"><QrCode size={48} className="text-gray-300"/></div>}
                </div>
              )}

              {!box.image_data && (
                <button className="bg-white/10 border border-white/20 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <ImageIcon size={16}/>}
                  {uploadingImage ? 'Uploading...' : `Upload ${box.is_standalone ? 'Item' : 'Box'} Photo`}
                </button>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
            </div>
          </div>

          {}
          <div className="space-y-4">
            {!box.is_standalone && (
              <div className="liquid-glass rounded-2xl p-6 border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-gray-300"><Hash size={18}/> Total Items</h3>
                  {!editingTotal && (
                    <button className="text-sm font-medium text-gray-400 hover:text-white" onClick={() => setEditingTotal(true)}>Edit</button>
                  )}
                </div>
                {editingTotal ? (
                  <div className="animate-in fade-in flex items-center gap-3">
                    <input type="number" min="0" className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-white/40"
                      value={totalItems} onChange={e => setTotalItems(e.target.value)} placeholder="0" autoFocus />
                    <button className="bg-white text-black px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors" onClick={handleSaveTotalItems}>Save</button>
                  </div>
                ) : (
                  <p className="text-2xl font-semibold">{box.total_items ?? <span className="text-gray-500 font-normal italic text-base">Not specified</span>}</p>
                )}
              </div>
            )}

            <div className="liquid-glass rounded-2xl p-6 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center gap-2 text-gray-300"><StickyNote size={18}/> Notes</h3>
                {!editingNotes && (
                  <button className="text-sm font-medium text-gray-400 hover:text-white" onClick={() => setEditingNotes(true)}>Edit</button>
                )}
              </div>
              {editingNotes ? (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 min-h-[120px] resize-none mb-4"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. fragile glassware, passport folder, laptop charger"
                    autoFocus />
                  <div className="flex justify-end gap-3">
                    <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors" onClick={() => { setEditingNotes(false); setNotes(box.notes || ''); }}>Cancel</button>
                    <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2" onClick={handleSaveNotes}><Save size={16}/> Save Notes</button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${box.notes ? 'text-gray-200' : 'text-gray-500 italic'}`}>
                  {box.notes || 'No notes yet. Tap Edit to add important items.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Pipeline */}
          <div className="liquid-glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-medium mb-1 text-gray-300">Update Status</h3>
            <p className="text-sm text-gray-500 mb-6">Pipeline view of the current status</p>

            <div className="relative flex flex-col gap-4">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-white/10" />

              {STATUSES.map((s, i) => {
                const Icon = STATUS_ICONS[s];
                const isCurrent = box.status === s;
                const isPast = i < currentIdx;

                return (
                  <button key={s}
                    className={`relative flex items-center gap-4 p-3 rounded-xl transition-all border text-left ${isCurrent ? 'bg-white/10 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : isPast ? 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white' : 'bg-transparent border-transparent text-gray-600 hover:bg-white/5 hover:text-gray-400'}`}
                    onClick={() => {
                      if (i === currentIdx + 1) startVerification(s);
                      else handleStatusChange(s);
                    }}
                    disabled={updating || isPast || isCurrent}>
                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center relative z-10 transition-colors ${isCurrent ? 'bg-white text-black' : isPast ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{s}</div>
                      <div className="text-xs opacity-60">
                        {isCurrent ? 'Current state' : isPast ? 'Completed step' : 'Upcoming step'}
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="shrink-0 mr-2 w-2 h-2 rounded-full bg-white animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status History */}
          <div className="liquid-glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-medium flex items-center gap-2 mb-6 text-gray-300"><Clock size={18}/> Status History</h3>
            {box.status_history?.length > 0 ? (
              <div className="space-y-4">
                {box.status_history.map(h => (
                  <div key={h.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-gray-500 mt-2 shrink-0" />
                    <div className="flex-1 bg-white/5 rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className={`status-chip status-${h.old_status.toLowerCase()} text-xs px-2 py-0.5`}>{h.old_status}</span>
                        <span className="text-gray-500">→</span>
                        <span className={`status-chip status-${h.new_status.toLowerCase()} text-xs px-2 py-0.5`}>{h.new_status}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(h.changed_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock size={32} className="mx-auto mb-3 opacity-20" />
                <p>No status changes yet.</p>
              </div>
            )}
          </div>

          {}
          <div className="liquid-glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-medium mb-4 text-gray-300">System Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">{box.is_standalone ? 'Item ID' : 'Box ID'}</span>
                <span className="font-mono text-xs text-gray-300 break-all">{box.id}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Created</span>
                <span className="text-sm text-gray-300">{new Date(box.created_at).toLocaleString()}</span>
              </div>
              {box.updated_at && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 sm:col-span-2">
                  <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Last Updated</span>
                  <span className="text-sm text-gray-300">{new Date(box.updated_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoxDetails;
