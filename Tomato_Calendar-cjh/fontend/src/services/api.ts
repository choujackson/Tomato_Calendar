import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const BASE_URL = API_BASE_URL;

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒超时
});

// 请求拦截器：添加token和日志
api.interceptors.request.use(
  async (config) => {
    // 添加token
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 开发环境日志
    if (__DEV__) {
      console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
      console.log('📦 [Request Data]', config.data);
      console.log('🌐 [Base URL]', BASE_URL);
      if (token) {
        console.log('🔑 [Token]', token.substring(0, 20) + '...');
      }
    }
    
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('❌ [Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误和日志
api.interceptors.response.use(
  (response) => {
    // 开发环境日志
    if (__DEV__) {
      console.log(`✅ [API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('📦 [Response Data]', response.data);
    }
    return response;
  },
  async (error) => {
    // 开发环境错误日志
    if (__DEV__) {
      console.error(`❌ [API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      if (error.response) {
        console.error('📦 [Error Response]', error.response.data);
        console.error('📊 [Status]', error.response.status);
      } else if (error.request) {
        console.error('🌐 [Network Error]', '无法连接到服务器');
        console.error('💡 [Tip]', '请检查：1. 后端服务是否运行 2. API地址是否正确 3. 网络连接是否正常');
        console.error('🌐 [Current Base URL]', BASE_URL);
      } else {
        console.error('❌ [Error]', error.message);
      }
    }
    
    // 处理401错误
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
    }
    
    return Promise.reject(error);
  }
);

// API接口定义
export const authAPI = {
  // 发送注册验证码
  sendRegisterCode: async (email: string) => {
    const response = await api.post('/users/send-code', { email });
    return response.data;
  },

  // 用户注册
  register: async (email: string, password: string, code: string) => {
    const response = await api.post('/users/register', {
      email,
      password,
      code,
    });
    return response.data;
  },

  // 用户登录
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    
    // 保存token和用户信息
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // 发送重置密码验证码
  sendResetCode: async (email: string) => {
    const response = await api.post('/users/send-reset-code', { email });
    return response.data;
  },

  // 重置密码
  resetPassword: async (email: string, code: string, newPassword: string) => {
    const response = await api.post('/users/reset-password', {
      email,
      code,
      newPassword,
    });
    return response.data;
  },
};

// 习惯打卡 API
export const habitsAPI = {
  // 创建新习惯
  createHabit: async (name: string) => {
    const response = await api.post('/habits', { name });
    return response.data;
  },

  // 获取习惯列表 (包含统计数据)
  getHabits: async () => {
    const response = await api.get('/habits');
    return response.data;
  },

  // 执行打卡
  checkIn: async (id: number) => {
    const response = await api.post(`/habits/${id}/check-in`, {});
    return response.data;
  },

  // 删除习惯
  deleteHabit: async (id: number) => {
    const response = await api.delete(`/habits/${id}`);
    return response.data;
  },

  // 分享习惯到打卡广场
  shareToPlaza: async (id: number) => {
    const response = await api.post(`/habits/${id}/share`, {});
    return response.data;
  },
};

// 打卡广场 API
export const plazaAPI = {
  // 获取广场任务列表 (随机推荐)
  getHabits: async () => {
    const response = await api.get('/plaza/habits');
    return response.data;
  },

  // 发布广场任务
  createHabit: async (title: string) => {
    const response = await api.post('/plaza/habits', { title });
    return response.data;
  },

  // 广场打卡
  checkIn: async (id: number) => {
    const response = await api.post(`/plaza/habits/${id}/check-in`, {});
    return response.data;
  },

  // 加入我的打卡 (进货)
  adopt: async (id: number) => {
    const response = await api.post(`/plaza/habits/${id}/adopt`, {});
    return response.data;
  },

  // 点赞/取消点赞
  toggleLike: async (id: number) => {
    const response = await api.post(`/plaza/habits/${id}/like`, {});
    return response.data;
  },

  // 发表评论
  createComment: async (id: number, content: string) => {
    const response = await api.post(`/plaza/habits/${id}/comments`, { content });
    return response.data;
  },

  // 获取评论列表
  getComments: async (id: number) => {
    const response = await api.get(`/plaza/habits/${id}/comments`);
    return response.data;
  },

  // 删除广场卡片（只有创建者可以删除）
  deleteHabit: async (id: number) => {
    const response = await api.delete(`/plaza/habits/${id}`);
    return response.data;
  },
};

// 日程事件 API
export const eventsAPI = {
  createEvent: async (payload: {
    title: string;
    startTime: string;
    endTime: string;
    isAllDay?: boolean;
    location?: string;
    color?: string;
    repeat?: 'never' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    notes?: string;
  }) => {
    const response = await api.post('/events', payload);
    return response.data;
  },

  getEvents: async (startDate: string, endDate: string) => {
    const response = await api.get('/events', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getEvent: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  updateEvent: async (
    id: string,
    payload: Partial<{
      title: string;
      startTime: string;
      endTime: string;
      isAllDay: boolean;
      location: string;
      color: string;
      repeat: 'never' | 'daily' | 'weekly' | 'monthly' | 'yearly';
      notes: string;
    }>
  ) => {
    const response = await api.patch(`/events/${id}`, payload);
    return response.data;
  },

  deleteEvent: async (id: string) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

// 专注计时 API
export const focusAPI = {
  finishFocus: async (payload?: { duration?: number; tag?: string }) => {
    const response = await api.post('/focus/finish', payload ?? {});
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/focus/stats');
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/focus/history');
    return response.data;
  },
};

export default api;

