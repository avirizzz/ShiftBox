import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import { AuthProvider } from './components/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import Scanner from './pages/Scanner';
import BoxDetails from './pages/BoxDetails';
import LandingPage from './pages/LandingPage';
import Profile from './pages/Profile';
import AuthPage from './pages/AuthPage';
import { useAuth } from './components/AuthContext';
import { Navigate } from 'react-router-dom';

function InternalLayout() {
  return (
    <div className="flex min-h-screen relative z-10 bg-[url('/assets/mobile.png')] md:bg-[url('/assets/desktop.jpg')] bg-auto bg-center bg-no-repeat bg-fixed">
      <Sidebar />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 pt-20 sm:p-6 sm:pt-24 md:p-8 md:pt-8 pb-12 md:pb-12 md:pl-[100px] lg:pl-[120px] min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:id" element={<CategoryDetail />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/box/:id" element={<BoxDetails />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/app/*" element={
              <ProtectedRoute>
                <InternalLayout />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
