import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, AfterViewInit {
    @ViewChild('expenseChart') private chartRef!: ElementRef;
    chart: any;
    summary: any = { income: 0, expenses: 0, balance: 0, chart_data: { labels: [], data: [] } };
    transactions: any[] = [];
    user: any = { name: '' };

    constructor(
        private dashboardService: DashboardService,
        private authService: AuthService,
        private router: Router
    ) {
        this.user.name = this.authService.getUserName();
    }

    ngOnInit() {
        this.dashboardService.getSummary().subscribe(data => {
            this.summary = data;
            this.updateChart();
        });
        this.dashboardService.getTransactions().subscribe(data => {
            this.transactions = data;
        });
    }

    ngAfterViewInit() {
        // Chart init moved to updateChart since we need data first
    }

    updateChart() {
        if (!this.chartRef || !this.summary.chart_data.labels.length) return;

        if (this.chart) this.chart.destroy();

        const ctx = this.chartRef.nativeElement.getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.summary.chart_data.labels,
                datasets: [{
                    data: this.summary.chart_data.data,
                    backgroundColor: ['#4318FF', '#6AD2FF', '#EFF4FB', '#F4F7FE'], // Example colors
                    borderWidth: 0,

                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                }
            }
        });
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
