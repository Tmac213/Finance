import { getAuthToken, clearAuthSession } from './authStore';

// Declare Capacitor on window for TypeScript
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }
}

const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
const isAndroid = isNative && window.Capacitor?.getPlatform?.() === 'android';

// For Android: Use 10.0.2.2 for emulator, or allow override via environment variable
// For real devices, you need to use your computer's IP address on the same network
// Example: http://192.168.1.100:3001
const getApiBaseUrl = () => {
  if (isNative) {
    // Check for environment variable override (useful for real devices)
    const override = import.meta.env.VITE_ANDROID_API_URL;
    if (override) {
      return override;
    }
    // Default to emulator address
    return 'http://10.0.2.2:3001';
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

function buildUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL is not configured');
  }
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 10000; // 10 sec timeout default

async function request<T = any>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const { skipAuth, timeoutMs, ...fetchOptions } = options;
  const headers: Record<string, string> = {};

  // Convert Headers to plain object
  if (fetchOptions.headers) {
    if (fetchOptions.headers instanceof Headers) {
      fetchOptions.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(fetchOptions.headers)) {
      fetchOptions.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, fetchOptions.headers);
    }
  }

  if (!headers['Content-Type'] && fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = buildUrl(path);
  const timeoutDuration = typeof timeoutMs === 'number' ? timeoutMs : DEFAULT_TIMEOUT_MS;

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn('Request timeout for:', url);
    controller.abort();
  }, timeoutDuration);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = 'API request failed';
      let errorDetails: any = null;
      try {
        const text = await response.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            errorMessage = json.error || json.message || text;
            errorDetails = json;
          } catch {
            errorMessage = text;
          }
        }
      } catch {
        // Fallback to default message
      }
      console.error('[API] Request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        errorDetails,
      });

      // Handle 401 Unauthorized errors (invalid/expired tokens)
      if (response.status === 401 && !skipAuth) {
        console.warn('[API] Authentication failed - clearing session and redirecting to login');
        clearAuthSession();
        // Redirect to login page immediately
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          // Use replace instead of href to prevent back button issues, and redirect immediately
          window.location.replace('/login');
          // Create a special error that indicates we're redirecting (so UI can suppress toast)
          const authError = new Error('Session expired. Redirecting to login...');
          (authError as any).status = 401;
          (authError as any).details = errorDetails;
          (authError as any).isAuthRedirect = true; // Flag to suppress error toast
          // Throw the error but redirect is already happening, so UI should suppress it
          throw authError;
        }
        // Create a special error that indicates we're redirecting (so UI can suppress toast)
        const authError = new Error('Session expired. Redirecting to login...');
        (authError as any).status = 401;
        (authError as any).details = errorDetails;
        (authError as any).isAuthRedirect = true; // Flag to suppress error toast
        throw authError;
      }

      const error = new Error(errorMessage || `HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).details = errorDetails;
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: The server took too long to respond. Please check your connection and try again.');
    }

    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      const networkErrorMsg = isAndroid
        ? 'Network error: Make sure the backend server is running and accessible. For real devices, set VITE_ANDROID_API_URL to your computer\'s IP address (e.g., http://192.168.1.100:3001)'
        : 'Network error: Make sure the backend server is running';
      throw new Error(networkErrorMsg);
    }
    throw error;
  }
}

export const apiClient = {
  request,
  get<T = any>(path: string, options?: RequestInit & { skipAuth?: boolean; timeoutMs?: number }) {
    return request<T>(path, { ...options, method: 'GET' });
  },
  post<T = any>(path: string, body?: unknown, options?: RequestInit & { skipAuth?: boolean; timeoutMs?: number }) {
    return request<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
  },
  put<T = any>(path: string, body?: unknown, options?: RequestInit & { skipAuth?: boolean; timeoutMs?: number }) {
    return request<T>(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
  },
  delete<T = any>(path: string, options?: RequestInit & { skipAuth?: boolean; timeoutMs?: number }) {
    return request<T>(path, { ...options, method: 'DELETE' });
  },
};

export { API_BASE_URL };
