export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

export interface LoginData {
  username: string;
  password?: string;
}

export interface RegisterData {
  fullName: string;
  password?: string;
  email?: string;
  phone?: string;
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}
