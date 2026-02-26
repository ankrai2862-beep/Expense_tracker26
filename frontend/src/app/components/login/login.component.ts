import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
})
export class LoginComponent {
    email = '';
    password = '';
    error = '';
    isRegistering = false;
    fullName = '';

    constructor(private authService: AuthService, private router: Router) { }

    onSubmit() {
        this.error = '';
        if (this.isRegistering) {
            const user = { email: this.email, password: this.password, full_name: this.fullName };
            this.authService.register(user).subscribe({
                next: () => this.router.navigate(['/dashboard']),
                error: (err) => this.error = err.error.detail || 'Registration failed'
            });
        } else {
            const credentials = { username: this.email, password: this.password };
            this.authService.login(credentials).subscribe({
                next: () => this.router.navigate(['/dashboard']),
                error: (err) => this.error = 'Invalid credentials'
            });
        }
    }

    toggleMode() {
        this.isRegistering = !this.isRegistering;
        this.error = '';
    }
}
