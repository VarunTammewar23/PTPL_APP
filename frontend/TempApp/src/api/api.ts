// src/api/api.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getCurrentApiBase } from '../config/ConfigContext';

// small helper to build full url
const buildUrl = (path: string) => {
  const base = getCurrentApiBase() || '';
  // allow passing absolute URLs in path
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // ensure no double slashes
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

export async function apiGet<T = any>(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const url = buildUrl(path);
  return axios.get<T>(url, config);
}

export async function apiPost<T = any>(path: string, data?: any, config?: AxiosRequestConfig) {
  const url = buildUrl(path);
  return axios.post<T>(url, data, config);
}

// add other helpers as needed: apiPut, apiDelete...
export async function apiPut<T = any>(path: string, data?: any, config?: AxiosRequestConfig) {
  const url = buildUrl(path);
  return axios.put<T>(url, data, config);
}
