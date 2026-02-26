// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { AuthService } from './auth.service';

// @Injectable({
//     providedIn: 'root'
// })
// export class DashboardService {
//     private apiUrl = 'http://localhost:8080';

//     constructor(private http: HttpClient, private authService: AuthService) { }

//     private getHeaders(): HttpHeaders {
//         const token = this.authService.getToken();
//         return new HttpHeaders({
//             'Authorization': `Bearer ${token}`
//         });
//     }

//     getSummary(): Observable<any> {
//         return this.http.get(`${this.apiUrl}/dashboard/summary`, { headers: this.getHeaders() });
//     }

//     getTransactions(): Observable<any> {
//         return this.http.get(`${this.apiUrl}/transactions`, { headers: this.getHeaders() });
//     }

//     addTransaction(transaction: any): Observable<any> {
//         return this.http.post(`${this.apiUrl}/transactions`, transaction, { headers: this.getHeaders() });
//     }
// }


import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getSummary(): Observable<any> {
        return this.http.get(`${this.apiUrl}/dashboard/summary`, { headers: this.getHeaders() });
    }

    getTransactions(): Observable<any> {
        return this.http.get(`${this.apiUrl}/transactions`, { headers: this.getHeaders() });
    }

    addTransaction(transaction: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/transactions`, transaction, { headers: this.getHeaders() });
    }

    uploadPdfTransactions(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        // Do NOT set Content-Type header — browser sets it with boundary automatically
        const token = this.authService.getToken();
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
        return this.http.post(`${this.apiUrl}/transactions/upload-pdf`, formData, { headers });
    }
}
