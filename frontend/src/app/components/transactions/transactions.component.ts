// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { DashboardService } from '../../services/dashboard.service';

// @Component({
//     selector: 'app-transactions',
//     standalone: true,
//     imports: [CommonModule, FormsModule],
//     templateUrl: './transactions.component.html',
// })
// export class TransactionsComponent implements OnInit {
//     transactions: any[] = [];

//     // Form Model
//     newTx = {
//         amount: null,
//         category: '',
//         type: 'expense',
//         description: '',
//         date: new Date().toISOString().split('T')[0] // today
//     };

//     displayForm = false;

//     constructor(private dashboardService: DashboardService) { }

//     ngOnInit() {
//         this.refresh();
//     }

//     refresh() {
//         this.dashboardService.getTransactions().subscribe(data => {
//             this.transactions = data;
//         });
//     }

//     toggleForm() {
//         this.displayForm = !this.displayForm;
//     }

//     onSubmit() {
//         if (!this.newTx.amount || !this.newTx.category) return;

//         this.dashboardService.addTransaction(this.newTx).subscribe({
//             next: () => {
//                 this.refresh();
//                 this.toggleForm();
//                 // Reset form
//                 this.newTx = { amount: null, category: '', type: 'expense', description: '', date: new Date().toISOString().split('T')[0] };
//             },
//             error: (err) => console.error("Failed to add transaction", err)
//         });
//     }
// }


import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
    transactions: any[] = [];

    // Form Model
    newTx = {
        amount: null,
        category: '',
        type: 'expense',
        description: '',
        date: new Date().toISOString().split('T')[0]
    };

    displayForm = false;

    // PDF Upload state
    isUploading = false;
    uploadResult: { inserted: number; skipped: number; errors: string[] } | null = null;
    uploadError: string | null = null;

    // Add transaction error
    addError: string | null = null;

    constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.dashboardService.getTransactions().subscribe(data => {
                        console.log('Fetched transactions:', data); // Debug log
this.transactions = [...data];
            this.cdr.detectChanges(); // Ensure UI updates after data change
        });
    }

    toggleForm() {
        this.displayForm = !this.displayForm;
    }

    onSubmit() {
        if (!this.newTx.amount || !this.newTx.category) return;

        this.addError = null;
        this.dashboardService.addTransaction(this.newTx).subscribe({
            next: () => {
                this.refresh();
                this.toggleForm();
                this.newTx = { amount: null, category: '', type: 'expense', description: '', date: new Date().toISOString().split('T')[0] };
            },
            error: (err) => {
                console.error("Failed to add transaction", err);
                this.addError = err?.error?.detail || 'Failed to add transaction. Please try again.';
            }
        });
    }

    // ── PDF Upload ────────────────────────────────────────────────────────────

    triggerPdfUpload() {
        const input = document.getElementById('pdfFileInput') as HTMLInputElement;
        input?.click();
    }

    onPdfFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        this.isUploading = true;
        this.uploadResult = null;
        this.uploadError = null;

        this.dashboardService.uploadPdfTransactions(file).subscribe({
            next: (result: any) => {
                this.isUploading = false;
                this.uploadResult = result;
                this.refresh();
                // Reset file input so same file can be re-uploaded if needed
                input.value = '';
            },
            error: (err) => {
                this.isUploading = false;
                this.uploadError = err?.error?.detail || 'Upload failed. Please try again.';
                input.value = '';
            }
        });
    }

    dismissUploadResult() {
        this.uploadResult = null;
        this.uploadError = null;
    }
}
