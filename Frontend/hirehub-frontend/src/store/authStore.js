import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { isTokenValid } from '../utils/tokenUtils'; // Bug #6 — shared utility

function getValidAuthState() {
  try {
    const stored = localStorage.getItem('hirehub-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.token && isTokenValid(parsed.state.token)) {
        return {
          token: parsed.state.token,
          user: parsed.state.user,
          role: parsed.state.role,
        };
      }
    }
  } catch {
    // ignore parse errors
  }
  localStorage.removeItem('hirehub-auth');
  return { token: null, user: null, role: null };
}

const initialState = getValidAuthState();

export const useAuthStore = create(
  persist(
    (set) => ({
      token: initialState.token,
      user: initialState.user,
      role: initialState.role,

      login: (token, userData) => {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            console.error('Token already expired');
            set({ token: null, user: null, role: null });
            return;
          }
          // FIX 15 — Token now has lean payload (sub, email, role only)
          // Use userData from login response if provided, otherwise fall back to token
          const user = {
            id: decoded.sub,
            email: userData?.email || decoded.email || '',
            name: userData?.full_name || userData?.name || '',
            role: decoded.role,
          };
          set({ token, user, role: decoded.role });
        } catch {
          console.error('Failed to decode JWT');
          set({ token: null, user: null, role: null });
        }
      },

      logout: () => {
        set({ token: null, user: null, role: null });
        localStorage.removeItem('hirehub-auth');
      },

      updateUser: (fields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : null,
        })),

      fetchCurrentUser: async () => {
        const state = useAuthStore.getState();
        if (!state.token || !isTokenValid(state.token)) return;
        try {
          const axiosInstance = (await import('../api/axiosInstance')).default;
          const res = await axiosInstance.get('/auth/me');
          if (res.data?.user) {
            const dbUser = res.data.user;
            set({
              user: {
                id: dbUser.id || dbUser._id,
                email: dbUser.email,
                name: dbUser.full_name || dbUser.name,
                role: dbUser.role,
              },
              role: dbUser.role,
            });
          }
        } catch (err) {
          console.error('Failed to fetch current user from backend:', err);
        }
      },

      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!state.token && isTokenValid(state.token);
      },
    }),
    {
      name: 'hirehub-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        role: state.role,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.token && !isTokenValid(state.token)) {
          state.token = null;
          state.user = null;
          state.role = null;
        }
      },
    }
  )
);

export function homePath(role) {
  switch (role) {
    case 'jobseeker':
      return '/jobseeker/dashboard';
    case 'employer':
      return '/employer/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/login';
  }
}
