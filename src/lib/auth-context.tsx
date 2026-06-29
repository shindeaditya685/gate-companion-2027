'use client';

import { createContext, useContext } from 'react';

type AuthUser = { id: string; name: string; email: string };

type AuthContextType = {
  user: AuthUser | null;
  logout: () => void;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);
