import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { LoginResponse, User, UserRole } from '../models/user';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'vpms_token';
const API_BASE = `${environment.apiUrl}/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<LoginResponse>(`${API_BASE}/login`, credentials).pipe(
      tap((res) => {
        // Handle backend response: { success, message, data: { token, user } }
        const token = res.data?.token || res.token!;
        const user = res.data?.user || res.user!;
        this.setSession(token, user);
      }),
      map((res) => res.data?.user || res.user!)
    );
  }

  register(data: {
    fullName: string;
    phone?: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    return this.http.post<LoginResponse>(`${API_BASE}/register`, data).pipe(
      tap((res) => {
        // Handle backend response: { success, message, data: { token, user } }
        const token = res.data?.token || res.token!;
        const user = res.data?.user || res.user!;
        this.setSession(token, user);
      }),
      map((res) => ({
        user: res.data?.user || res.user!,
        message: res.message || 'Registration successful',
      }))
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.userSubject.next(null);
  }

  getResidents(): Observable<{ success: boolean; residents: any[] }> {
    return this.http.get<{ success: boolean; residents: any[] }>(
      `${API_BASE}/residents`
    );
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getUserRole(): UserRole | null {
    return this.userSubject.value?.role ?? null;
  }

  private setSession(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    this.userSubject.next(user);
  }

  private restoreSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    this.fetchMe(token).subscribe();
  }

  private fetchMe(token: string) {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<{ user: User }>(`${API_BASE}/me`, { headers }).pipe(
      tap((res) => this.userSubject.next(res.user)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }
}
