/**
 * src/services/authService.ts — Phase 4: Mock Authentication Service.
 * Implements clean auth boundary. UI components call this service rather than importing mock arrays.
 * Easily swappable with ApiAuthService (FastAPI / Supabase / Auth0) in future phases.
 */

import { delay } from '../lib/api';
import { mockAuthUsers, type AuthUser } from '../mock/authUsers';

const AUTH_STORAGE_KEY = 'adaptive_auth_user';

export class MockAuthService {
  private currentUser: AuthUser | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch {
      this.currentUser = null;
    }
  }

  private saveToStorage(user: AuthUser | null) {
    this.currentUser = user;
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // storage unavailable
    }
  }

  async login(email: string, _password?: string, requestedRole?: 'student' | 'faculty'): Promise<AuthUser> {
    await delay(600);
    const normalizedEmail = email.trim().toLowerCase();
    let found = mockAuthUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!found) {
      if (requestedRole) {
        found = mockAuthUsers.find((u) => u.role === requestedRole);
      } else {
        found = mockAuthUsers[0]; // fallback to student
      }
    }

    if (!found) {
      throw new Error('Invalid email or credentials');
    }

    this.saveToStorage(found);
    return found;
  }

  async demoLogin(role: 'student' | 'faculty'): Promise<AuthUser> {
    await delay(450);
    const target = mockAuthUsers.find((u) => u.role === role);
    if (!target) {
      throw new Error(`Demo user for role ${role} not found`);
    }
    this.saveToStorage(target);
    return target;
  }

  async logout(): Promise<void> {
    await delay(200);
    this.saveToStorage(null);
  }

  getCurrentUser(): AuthUser | null {
    if (!this.currentUser) {
      this.loadFromStorage();
    }
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const authService = new MockAuthService();
export type { AuthUser };
