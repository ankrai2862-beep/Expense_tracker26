import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { AboutComponent } from './components/about/about.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'transactions', component: TransactionsComponent },
            { path: 'about', component: AboutComponent }
        ]
    }
];
