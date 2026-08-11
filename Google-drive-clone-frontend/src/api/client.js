export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

const TOKEN_KEY = 'gd_token';
const REFRESH_TOKEN_KEY = 'gd_refresh_token';

export const tokenStore = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (token, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export class ApiRequestError extends Error {
  constructor(status, body) {
    super(body.message || 'Request failed');
    this.status = status;
    this.errors = body.errors;
  }
}

async function tryRefreshToken() {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!res.ok) return null;
  const data = await res.json();
  tokenStore.setTokens(data.token, refreshToken);
  return data.token;
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, isFormData = false, skipAuth = false } = options;

  const doFetch = async (token) => {
    const headers = {};
    if (!isFormData) headers['Content-Type'] = 'application/json';
    if (token && !skipAuth) headers.Authorization = `Bearer ${token}`;

    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body)
    });
  };

  let token = skipAuth ? null : tokenStore.getToken();
  let res = await doFetch(token);

  if (res.status === 401 && !skipAuth && tokenStore.getRefreshToken()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await doFetch(refreshed);
    } else {
      tokenStore.clear();
    }
  }

  if (!res.ok) {
    let errBody = { message: `Request failed with status ${res.status}` };
    try {
      errBody = await res.json();
    } catch {
      // response had no JSON body
    }
    throw new ApiRequestError(res.status, errBody);
  }

  if (res.status === 204) return undefined;
  return res.json();
}
