import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about.component.html',
})
export class AboutComponent {
    appInfo = {
        name: 'Expense Tracker',
        // version: '1.0.0',
        description: 'Expense Tracker is a full-stack financial management application designed to help users monitor, analyze, and optimize their personal finances. It provides real-time dashboards, structured expense categorization, and interactive analytics for smarter financial decisions.',
       features: [
    {
      title: 'Income & Expense Management',
      description: 'Add, edit, and organize transactions with detailed tracking including amount, date, category, and notes.'
    },
    {
      title: 'Interactive Dashboard',
      description: 'Real-time financial summaries with total income, total expenses, and available balance.'
    },
    {
      title: 'Advanced Visual Analytics',
      description: 'Dynamic charts and category-wise breakdowns to better understand spending patterns.'
    },
    {
      title: 'Category-Based Organization',
      description: 'Custom categories to structure expenses and track where your money flows.'
    }
  ],
        technologies: {
            frontend: ['Angular 17', 'TypeScript', 'TailwindCSS', 'Chart.js'],
            backend: ['FastAPI', 'Python', 'MongoDB Atlas']
        }
    };
}
