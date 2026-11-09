export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'google' | 'email' | 'mock';
  created_at: string;
  tier?: 'free' | 'pro';
}

export interface AuthSession {
  user: UserProfile;
  access_token: string;
  expires_at?: number;
}

export interface AuthState {
  user: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}
