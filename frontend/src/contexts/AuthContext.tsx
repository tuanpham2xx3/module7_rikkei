import React, { useEffect, useState } from 'react';
import type { UserProfile, AuthSession } from '../types/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AuthContext } from './auth-context';

const LOCAL_STORAGE_KEY = 'doodlelife_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured() && supabase) {
          const { data: { session: sbSession }, error: sbError } = await supabase.auth.getSession();
          if (sbError) throw sbError;

          if (sbSession?.user) {
            const userProfile: UserProfile = {
              id: sbSession.user.id,
              email: sbSession.user.email || '',
              name: sbSession.user.user_metadata?.full_name || sbSession.user.user_metadata?.name || sbSession.user.email?.split('@')[0] || 'Doodler',
              avatar_url: sbSession.user.user_metadata?.avatar_url,
              provider: (sbSession.user.app_metadata?.provider as any) || 'email',
              created_at: sbSession.user.created_at,
              tier: 'free'
            };
            setUser(userProfile);
            setSession({
              user: userProfile,
              access_token: sbSession.access_token,
              expires_at: sbSession.expires_at
            });
          } else {
            setUser(null);
            setSession(null);
          }

          // Listen for Supabase auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            if (currentSession?.user) {
              const updatedProfile: UserProfile = {
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                name: currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'Doodler',
                avatar_url: currentSession.user.user_metadata?.avatar_url,
                provider: (currentSession.user.app_metadata?.provider as any) || 'email',
                created_at: currentSession.user.created_at,
                tier: 'free'
              };
              setUser(updatedProfile);
              setSession({
                user: updatedProfile,
                access_token: currentSession.access_token,
                expires_at: currentSession.expires_at
              });
            } else {
              setUser(null);
              setSession(null);
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } else {
          // Check local storage for mock session
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as AuthSession;
              setUser(parsed.user);
              setSession(parsed);
            } catch {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
          }
        }
      } catch (err: any) {
        console.error('Session initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase client is not configured.');
      }

      const { error: sbError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (sbError) throw sbError;
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Không thể đăng nhập bằng Google. Vui lòng thử lại!';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (sbError) throw sbError;

        if (data.user && data.session) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Doodler',
            avatar_url: data.user.user_metadata?.avatar_url,
            provider: 'email',
            created_at: data.user.created_at,
            tier: 'free'
          };
          setUser(profile);
          setSession({
            user: profile,
            access_token: data.session.access_token,
            expires_at: data.session.expires_at
          });
        }
        return { success: true };
      } else {
        // Mock Email Login fallback
        await new Promise((r) => setTimeout(r, 500));
        if (password.length < 6) {
          throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
        }
        const profile: UserProfile = {
          id: 'user_email_mock_' + Date.now().toString(36),
          email,
          name: email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(email)}`,
          provider: 'email',
          created_at: new Date().toISOString(),
          tier: 'free'
        };
        const mockSession: AuthSession = {
          user: profile,
          access_token: 'mock_jwt_email_token_' + Math.random().toString(36).substring(2),
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7
        };
        setUser(profile);
        setSession(mockSession);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockSession));
        return { success: true };
      }
    } catch (err: any) {
      const msg = err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu!';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error: sbError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              full_name: name
            }
          }
        });
        if (sbError) throw sbError;

        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || '',
            name,
            provider: 'email',
            created_at: data.user.created_at,
            tier: 'free'
          };
          setUser(profile);
          if (data.session) {
            setSession({
              user: profile,
              access_token: data.session.access_token,
              expires_at: data.session.expires_at
            });
          }
        }
        return { success: true };
      } else {
        // Mock Register fallback
        await new Promise((r) => setTimeout(r, 600));
        if (password.length < 6) {
          throw new Error('Mật khẩu phải từ 6 ký tự trở lên.');
        }
        const profile: UserProfile = {
          id: 'user_reg_mock_' + Date.now().toString(36),
          email,
          name: name || email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(email)}`,
          provider: 'email',
          created_at: new Date().toISOString(),
          tier: 'free'
        };
        const mockSession: AuthSession = {
          user: profile,
          access_token: 'mock_jwt_token_' + Math.random().toString(36).substring(2),
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7
        };
        setUser(profile);
        setSession(mockSession);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockSession));
        return { success: true };
      }
    } catch (err: any) {
      const msg = err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin!';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
