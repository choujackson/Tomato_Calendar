export interface User {
  id: number;
  email: string;
  username: string;
  signature: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

