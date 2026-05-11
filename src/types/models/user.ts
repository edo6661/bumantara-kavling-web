export interface Permission {
  resource: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions?: Permission[];
}

export interface LoginData {
  token: string;
  user: User;
}
