import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../api';
import { useToast } from '../components/ToastContext';
import {
  ScanLine, Camera, CameraOff, Package, ChevronRight, X, Zap
} from 'lucide-react';

function Scanner() {
  const navigate = useNavigate();
  const toast = useToast();
  const [scanning, setScanning] = useState(false);
  const [scannedBox, setScannedBox] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const html5QrRef = useRef(null);

  const STATUSES = ['Planned', 'Packed', 'Loaded', 'Unloaded', 'Verified'];

  const startScanner = async () => {
    try {
      setCameraError(null);
      setScannedBox(null);
      setScanSuccess(false);

      const html5Qr = new Html5Qrcode("qr-reader");
      html5QrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        onScanSuccess,
        () => {} 
      );
      setScanning(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError('Camera access denied or unavailable. Please allow camera permissions and try again.');
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrRef.current) {
        await html5QrRef.current.stop();
        html5QrRef.current = null;
      }
    } catch {}
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    await stopScanner();
    new Audio('/assets/scansound.mp3').play().catch(console.error);
    setScanSuccess(true);

    try {
      let boxId = null;
      try {
        if (decodedText.includes('/box/')) {
          boxId = decodedText.split('/box/')[1].split('/')[0].split('?')[0];
        } else {
          try {
            const parsed = JSON.parse(decodedText);
            boxId = parsed.boxId || parsed.id;
          } catch {
            boxId = decodedText.trim();
          }
        }
      } catch {
        boxId = null;
      }

      if (!boxId) {
        toast('Invalid QR code', 'error');
        return;
      }

      const boxData = await api.scanBox(boxId);
      toast(`Scanned: ${boxData.box_number}`, 'success');
      navigate(`/app/box/${boxData.id}`);
    } catch (err) {
      toast('Box not found for this QR code', 'error');
      setScanSuccess(false);
    }
  };

  const handleQuickStatus = async (newStatus) => {
    if (!scannedBox || updating) return;
    setUpdating(true);
    try {
      const updated = await api.updateBox(scannedBox.id, { status: newStatus });
      setScannedBox(prev => ({ ...prev, ...updated }));
      toast(`${scannedBox.box_number} → ${newStatus}`, 'success');
    } catch { toast('Update failed', 'error'); }
    finally { setUpdating(false); }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="text-white animate-in fade-in duration-500">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">QR Scanner</h1>
        <p className="text-gray-400 mt-1">Scan a box QR code to view and update instantly</p>
      </header>

      <div className="max-w-2xl mx-auto">
        {}
        <div className="liquid-glass rounded-2xl overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center border border-white/5 shadow-2xl">
          <div id="qr-reader" className="w-full [&>video]:w-full [&>video]:object-cover" />

          {!scanning && !scannedBox && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-md">
              {cameraError ? (
                <>
                  <CameraOff size={48} className="text-red-500 mb-4" />
                  <p className="text-gray-300 mb-6 max-w-sm">{cameraError}</p>
                  <button className="bg-white text-black px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2" onClick={startScanner}>
                    <Camera size={16} /> Try Again
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
                    <ScanLine size={32} />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Ready to Scan</h3>
                  <p className="text-gray-400 mb-8 max-w-sm">Point your camera at a box QR code</p>
                  <button className="bg-white text-black px-8 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]" onClick={startScanner}>
                    <Camera size={18} /> Start Camera
                  </button>
                </>
              )}
            </div>
          )}

          {scanning && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <button className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/40 transition-colors flex items-center gap-2 backdrop-blur-md" onClick={stopScanner}>
                <X size={16} /> Stop Scanning
              </button>
            </div>
          )}

          {scanSuccess && !scannedBox && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
              <p className="font-medium text-gray-300">Processing scan...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Scanner;
