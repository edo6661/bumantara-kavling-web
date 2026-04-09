export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface LoginData {
  token: string;
  user: User;
}
