import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { Package } from 'lucide-react';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast('Logged in successfully', 'success');
      } else {
        await signup(email, password, name);
        toast('Account created successfully! Please log in.', 'success');
        setIsLogin(true);
        return; 
      }
      navigate('/app');
    } catch (err) {
      toast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black text-white">
      {}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-red-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-500/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="liquid-glass w-full max-w-md p-8 rounded-3xl relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <Package size={32} className="text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-semibold text-center tracking-tight mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          {isLogin ? 'Sign in to access your ShiftBox' : 'Start organizing your shift with ShiftBox'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-medium">Full Name</label>
              <input 
                type="text" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all" 
                placeholder="John Doe" 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>
          )}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-medium">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all" 
              placeholder="you@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-medium">Password</label>
            <input 
              type="password" 
              required 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl mt-4 hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-white hover:underline font-medium transition-colors"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
