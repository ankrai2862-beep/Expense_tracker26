import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './layout.component.html',
})
export class LayoutComponent {
    user: any = { name: '' };

    constructor(private authService: AuthService, private router: Router) {
        this.user.name = this.authService.getUserName();
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
