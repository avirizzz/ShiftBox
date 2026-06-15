import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ ...session.user, name: session.user.user_metadata?.name || session.user.email?.split('@')[0] });
        localStorage.setItem('supabase.auth.token', session.access_token);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ ...session.user, name: session.user.user_metadata?.name || session.user.email?.split('@')[0] });
        localStorage.setItem('supabase.auth.token', session.access_token);
      } else {
        setUser(null);
        localStorage.removeItem('supabase.auth.token');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { name } }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
