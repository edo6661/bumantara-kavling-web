export interface Permission {
  resource: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface MandorProfile {
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  mandor?: MandorProfile | null;
  permissions?: Permission[];
}

export interface ProfileData extends User {
  createdAt?: string;
}

export interface LoginData {
  token: string;
  user: User;
}
