import type { User } from "../types/models/user";
import type { Perumahan } from "../types/models/perumahan";

const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  PERUMAHAN: "perumahan",
} as const;

const getItemSafe = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
};

export const storage = {
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  setToken: (token: string) => localStorage.setItem(STORAGE_KEYS.TOKEN, token),

  getUser: () => getItemSafe<User>(STORAGE_KEYS.USER),
  setUser: (user: User) =>
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),

  getPerumahan: () => getItemSafe<Perumahan>(STORAGE_KEYS.PERUMAHAN),
  setPerumahan: (perumahan: Perumahan) =>
    localStorage.setItem(STORAGE_KEYS.PERUMAHAN, JSON.stringify(perumahan)),

  clearAuth: () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
