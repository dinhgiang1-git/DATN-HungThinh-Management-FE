const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const PUBLIC_HOSTS = new Set(['dinhgiang1.xyz', 'www.dinhgiang1.xyz']);

const getCurrentHost = () => window.location.hostname;

const getSameOriginWsBaseUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

export const isLocalHost = () => LOCAL_HOSTS.has(getCurrentHost());

export const isPublicHost = () => PUBLIC_HOSTS.has(getCurrentHost());

export const getApiBaseUrl = () => {
  if (isPublicHost()) {
    return '';
  }

  return import.meta.env.VITE_API_BASE_URL || (isLocalHost() ? 'http://localhost:8081' : window.location.origin);
};

export const getWsBaseUrl = () => {
  if (isPublicHost()) {
    return getSameOriginWsBaseUrl();
  }

  return import.meta.env.VITE_WS_BASE_URL || (isLocalHost() ? 'ws://localhost:8081' : getSameOriginWsBaseUrl());
};
