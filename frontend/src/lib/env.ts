const trimTrailingSlash = (value?: string | null) => {
  if (!value) return undefined;
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const BACKEND_URL = trimTrailingSlash(import.meta.env.VITE_BACKEND_URL);
const SOCKET_URL =
  trimTrailingSlash(import.meta.env.VITE_SOCKET_URL) ?? BACKEND_URL;

export const apiUrl = (path: string) => {
  if (!path.startsWith("/")) {
    return `${BACKEND_URL ?? ""}/${path}`;
  }
  return `${BACKEND_URL ?? ""}${path}`;
};

export const backendURL = BACKEND_URL ?? "";
export const socketURL = SOCKET_URL;
