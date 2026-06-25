export interface AuthUser {
  id: string;
  email: string;
}

export function setAuthSession(user: AuthUser, token: string) {
  localStorage.setItem('auth.token', token);
  localStorage.setItem('auth.user', JSON.stringify(user));
}

export function loadStoredSession(): { user: AuthUser | null; token: string | null } {
  const userRaw = localStorage.getItem('auth.user');
  const token = localStorage.getItem('auth.token');
  return {
    user: userRaw ? JSON.parse(userRaw) : null,
    token: token || null
  };
}

export function clearAuthSession() {
  localStorage.removeItem('auth.user');
  localStorage.removeItem('auth.token');
}

export function getCurrentUser(): AuthUser | null {
  const userRaw = localStorage.getItem('auth.user');
  return userRaw ? JSON.parse(userRaw) : null;
}

export function getCurrentUserId(): string | null {
  const user = getCurrentUser();
  return user?.id || null;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth.token');
}

