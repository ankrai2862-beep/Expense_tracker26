import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl + '/auth';
    private tokenKey = 'access_token';
    public isAuthenticated = new BehaviorSubject<boolean>(this.hasToken());

    constructor(private http: HttpClient) { }

    private hasToken(): boolean {
        return !!localStorage.getItem(this.tokenKey);
    }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((response: any) => {
                console.log('Login response:', response);
                console.log('Full name from response:', response.full_name);
                localStorage.setItem(this.tokenKey, response.access_token);
                if (response.full_name) {
                    console.log('Storing full_name:', response.full_name);
                    localStorage.setItem('user_name', response.full_name);
                } else {
                    console.warn('No full_name in response!');
                }
                this.isAuthenticated.next(true);
            })
        );
    }

    register(user: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, user).pipe(
            tap((response: any) => {
                localStorage.setItem(this.tokenKey, response.access_token);
                if (response.full_name) {
                    localStorage.setItem('user_name', response.full_name);
                }
                this.isAuthenticated.next(true);
            })
        );
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem('user_name');
        this.isAuthenticated.next(false);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    getUserName(): string {
        return localStorage.getItem('user_name') || 'User';
    }
}
