import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AnimatedHeading from '../components/AnimatedHeading';
import FadeIn from '../components/FadeIn';
import { useAuth } from '../components/AuthContext';
import { LogOut, Package, QrCode, Truck, ShieldCheck, ArrowRight, Menu, X } from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  return (
    <div className="w-full bg-black text-white min-h-screen font-sans">

      {}
      <div className="relative w-full h-screen overflow-hidden">
        {}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
        />

        {}
        <div className="relative z-10 w-full h-full flex flex-col">
          {}
          <div className="px-6 md:px-12 lg:px-16 pt-6">
            <nav className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between shadow-2xl border border-white/10">
              {}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                  <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain p-0.5 rounded-full" />
                </div>
                <span className="text-xl font-semibold tracking-tight">ShiftBox</span>
              </div>

              {}
              <button 
                className="md:hidden text-white hover:text-gray-300 transition-colors ml-auto"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>

              {}
              <div className="hidden md:flex gap-8 text-sm">
                <a href="#features" className="hover:text-gray-300 transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-gray-300 transition-colors">How it Works</a>
                {user && <Link to="/profile" className="hover:text-gray-300 transition-colors">Profile</Link>}
              </div>

              {}
              <div className="hidden md:flex items-center gap-4">
                {user ? (
                  <>
                    <span className="text-sm text-gray-300 hidden sm:inline">Hi, {user.name}</span>
                    <button 
                      onClick={logout}
                      className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => navigate('/auth')}
                    className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Sign Up / Log In
                  </button>
                )}
              </div>
            </nav>
          </div>

          {}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                    <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain p-0.5 rounded-full" />
                  </div>
                  <span className="text-xl font-semibold tracking-tight">ShiftBox</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={28} />
                </button>
              </div>

              <div className="flex flex-col gap-6 text-xl font-medium">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-gray-300">Features</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-gray-300">How it Works</a>
                {user && <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="hover:text-gray-300">Profile</Link>}
              </div>

              <div className="mt-auto pt-8 border-t border-white/10">
                {user ? (
                  <div className="flex flex-col gap-4">
                    <span className="text-gray-400">Signed in as {user.name}</span>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="bg-white/10 border border-white/20 text-white px-6 py-4 rounded-xl text-center w-full font-medium hover:bg-white/20 flex items-center justify-center gap-2">
                      <LogOut size={20} /> Logout
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }} className="bg-white text-black px-6 py-4 rounded-xl text-center w-full font-medium hover:bg-gray-100">
                    Sign Up / Log In
                  </button>
                )}
              </div>
            </div>
          )}

          {}
          <div className="px-6 md:px-12 lg:px-16 flex-1 flex flex-col justify-end pb-12 lg:pb-16">
            <div className="lg:grid lg:grid-cols-2 lg:items-end">
              <div className="flex flex-col">
                <AnimatedHeading 
                  text={"Smarter moving.\nOne box at a time."}
                  className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-4"
                  initialDelay={200}
                  charDelay={30}
                  duration={500}
                />

                <FadeIn delay={800} duration={1000}>
                  <p className="text-base md:text-lg text-gray-300 mb-8 max-w-xl">
                    Generate QR codes, pack your boxes, and track every item securely from your old home to your new one.
                  </p>
                </FadeIn>

                <FadeIn delay={1200} duration={1000}>
                  <div className="flex flex-wrap gap-4">
                    {user ? (
                      <>
                        <button 
                          onClick={() => navigate('/app')}
                          className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          Move someplace new <ArrowRight size={18} />
                        </button>
                        <button 
                          onClick={() => navigate('/app')}
                          className="liquid-glass border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-colors"
                        >
                          Manage previous shifts
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => navigate('/auth')}
                          className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          Get Started <ArrowRight size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </FadeIn>
              </div>

              <div className="flex items-end justify-start lg:justify-end mt-8 lg:mt-0">
                <FadeIn delay={1400} duration={1000}>
                  <div className="liquid-glass border border-white/20 px-6 py-3 rounded-xl shadow-2xl">
                    <span className="text-lg md:text-xl lg:text-2xl font-light">
                      Packing. Tracking. Moving.
                    </span>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <section id="features" className="py-24 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-semibold mb-4 tracking-tight">Everything you need to move.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Say goodbye to lost items and disorganized chaos. ShiftBox brings enterprise-grade logistics to your personal move.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="liquid-glass p-8 rounded-[2rem] border border-white/5 hover:border-white/20 transition-colors flex flex-col gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-2">
              <QrCode size={28} />
            </div>
            <h3 className="text-2xl font-medium">Smart QR Tracking</h3>
            <p className="text-gray-400 leading-relaxed">
              Generate unique, scannable QR codes for every single box. Instantly view its contents, destination room, and current transit status with a quick scan.
            </p>
          </div>

          <div className="liquid-glass p-8 rounded-[2rem] border border-white/5 hover:border-white/20 transition-colors flex flex-col gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-2">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-2xl font-medium">Verified Handoffs</h3>
            <p className="text-gray-400 leading-relaxed">
              Our strict scanning protocols mean a box status cannot change unless it's physically scanned. Know exactly when your box is loaded and unloaded.
            </p>
          </div>

          <div className="liquid-glass p-8 rounded-[2rem] border border-white/5 hover:border-white/20 transition-colors flex flex-col gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-2">
              <Package size={28} />
            </div>
            <h3 className="text-2xl font-medium">Visual Inventory</h3>
            <p className="text-gray-400 leading-relaxed">
              Upload photos of your box contents before sealing. Never guess which "Kitchen" box contains your coffee maker ever again.
            </p>
          </div>
        </div>
      </section>

      {}
      <section id="how-it-works" className="py-24 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        <div className="grid lg:grid-cols-2 gap-16 items-center pt-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-semibold mb-6 tracking-tight">How it works</h2>
            <div className="space-y-12 mt-12">

              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg">1</div>
                  <div className="w-px h-full bg-white/20"></div>
                </div>
                <div className="pb-8">
                  <h4 className="text-xl font-medium mb-2">Create & Categorize</h4>
                  <p className="text-gray-400">Add rooms and create digital boxes for each category. Group your belongings logically before you start packing.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg">2</div>
                  <div className="w-px h-full bg-white/20"></div>
                </div>
                <div className="pb-8">
                  <h4 className="text-xl font-medium mb-2">Pack & Label</h4>
                  <p className="text-gray-400">Generate a secure QR label for the box. Snap a picture of the open box, declare the total item count, and seal it.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg">3</div>
                </div>
                <div>
                  <h4 className="text-xl font-medium mb-2">Scan & Move</h4>
                  <p className="text-gray-400">Scan the box when it enters the truck (Loaded) and scan it again when it arrives (Unloaded). Verify the seal matches the photo.</p>
                </div>
              </div>

            </div>
          </div>

          <div className="relative h-[600px] liquid-glass rounded-[3rem] border border-white/10 overflow-hidden flex items-center justify-center p-8">
             <div className="w-full max-w-sm aspect-[9/16] bg-black/50 border border-white/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
               {}
               <div className="p-4 border-b border-white/10 flex justify-between items-center">
                 <div className="w-8 h-8 rounded-full bg-white/10"></div>
                 <div className="text-xs font-medium uppercase tracking-widest text-gray-400">Scanning...</div>
                 <div className="w-8 h-8 rounded-full bg-white/10"></div>
               </div>
               <div className="flex-1 p-6 flex flex-col items-center justify-center gap-8 relative">
                 <div className="w-48 h-48 border-2 border-white/40 rounded-2xl relative">
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white"></div>
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white"></div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white"></div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white"></div>

                   <div className="absolute inset-0 m-auto w-32 h-32 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                     <QrCode size={48} className="text-white/50" />
                   </div>

                   {}
                   <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_10px_red] animate-[scan_2s_ease-in-out_infinite]"></div>
                 </div>

                 <div className="text-center">
                   <div className="text-white font-medium text-lg">Align QR Code</div>
                   <div className="text-gray-400 text-sm mt-1">Box details will appear instantly</div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {}
      <footer className="py-12 px-6 md:px-12 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>© 2026 ShiftBox Logistics. Smarter moving, one box at a time.</p>
      </footer>

    </div>
  );
}
