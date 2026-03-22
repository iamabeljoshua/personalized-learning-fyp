import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';
import { getToken, logout } from '../../auth/storage/auth.storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class HTTPService {
  public instance: AxiosInstance;

  public constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      timeout: 120_000,
    });

    this._initializeRequestInterceptor();
    this._initializeResponseInterceptor();
  }

  private _initializeRequestInterceptor = () => {
    this.instance.interceptors.request.use(async (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  };

  private _initializeResponseInterceptor = () => {
    this.instance.interceptors.response.use(this._handleResponse, this._handleError);
  };

  private _handleResponse = (data: AxiosResponse) => data.data;

  protected _handleError = async (error: AxiosError) => {
    if (error.response?.status === 401) {
      logout();
      window.location.href = '/auth';
      return;
    }
    return Promise.reject(error);
  };
}

export default HTTPService;
