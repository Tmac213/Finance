import * as XLSX from 'xlsx';

/**
 * Generates and downloads a template Excel file for transactions
 */
export function generateTransactionsTemplate() {
    // Create sample data with headers
    const templateData = [
        {
            'Type': 'income',
            'Description': 'Monthly Salary',
            'Category': 'Salary',
            'Date': '2024-01-15',
            'Amount': 5000
        },
        {
            'Type': 'expense',
            'Description': 'Grocery Shopping',
            'Category': 'Food',
            'Date': '2024-01-16',
            'Amount': 150.50
        },
        {
            'Type': 'expense',
            'Description': 'Electric Bill',
            'Category': 'Utilities',
            'Date': '2024-01-17',
            'Amount': 85.00
        }
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for better readability
    worksheet['!cols'] = [
        { wch: 10 },  // Type
        { wch: 25 },  // Description
        { wch: 15 },  // Category
        { wch: 12 },  // Date
        { wch: 12 }   // Amount
    ];

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions Template');

    // Add instructions sheet
    const instructions = [
        { 'Field': 'Type', 'Description': 'Must be either "income" or "expense"', 'Example': 'income' },
        { 'Field': 'Description', 'Description': 'Description of the transaction (required)', 'Example': 'Monthly Salary' },
        { 'Field': 'Category', 'Description': 'Category for organizing transactions', 'Example': 'Salary' },
        { 'Field': 'Date', 'Description': 'Date in YYYY-MM-DD format', 'Example': '2024-01-15' },
        { 'Field': 'Amount', 'Description': 'Amount in dollars (must be greater than 0)', 'Example': '5000' },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [
        { wch: 15 },  // Field
        { wch: 50 },  // Description
        { wch: 20 }   // Example
    ];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'transactions_template.xlsx');
}

/**
 * Generates and downloads a template Excel file for fixed dues
 */
export function generateFixedDuesTemplate() {
    // Create sample data with headers
    const templateData = [
        {
            'Name': 'Rent',
            'Amount': 1200,
            'Recurrence': 'monthly',
            'Start Date': '2024-01-01',
            'End Date': '2024-12-31'
        },
        {
            'Name': 'Internet Subscription',
            'Amount': 59.99,
            'Recurrence': 'monthly',
            'Start Date': '2024-01-01',
            'End Date': '2024-12-31'
        },
        {
            'Name': 'Car Insurance',
            'Amount': 450,
            'Recurrence': 'quarterly',
            'Start Date': '2024-01-01',
            'End Date': '2024-12-31'
        }
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for better readability
    worksheet['!cols'] = [
        { wch: 25 },  // Name
        { wch: 12 },  // Amount
        { wch: 15 },  // Recurrence
        { wch: 12 },  // Start Date
        { wch: 12 }   // End Date
    ];

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fixed Dues Template');

    // Add instructions sheet
    const instructions = [
        { 'Field': 'Name', 'Description': 'Name of the fixed due (required)', 'Example': 'Rent' },
        { 'Field': 'Amount', 'Description': 'Amount in dollars (must be greater than 0)', 'Example': '1200' },
        { 'Field': 'Recurrence', 'Description': 'One of: daily, weekly, monthly, quarterly, semi-annually, annually', 'Example': 'monthly' },
        { 'Field': 'Start Date', 'Description': 'Start date in YYYY-MM-DD format (required)', 'Example': '2024-01-01' },
        { 'Field': 'End Date', 'Description': 'End date in YYYY-MM-DD format (required)', 'Example': '2024-12-31' },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [
        { wch: 15 },  // Field
        { wch: 60 },  // Description
        { wch: 20 }   // Example
    ];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'fixed_dues_template.xlsx');
}

/**
 * Generates and downloads a template Excel file for Vibes Salary payments
 */
export function generateVibesSalaryTemplate() {
    // Create sample data with headers
    const templateData = [
        {
            'Amount': 5000,
            'Date': '2024-01-31',
            'Notes': 'January salary payment'
        },
        {
            'Amount': 5000,
            'Date': '2024-02-29',
            'Notes': 'February salary payment'
        },
        {
            'Amount': 5250,
            'Date': '2024-03-31',
            'Notes': 'March salary with bonus'
        }
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for better readability
    worksheet['!cols'] = [
        { wch: 12 },  // Amount
        { wch: 12 },  // Date
        { wch: 30 }   // Notes
    ];

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vibes Salary Template');

    // Add instructions sheet
    const instructions = [
        { 'Field': 'Amount', 'Description': 'Payment amount in dollars (must be greater than 0)', 'Example': '5000' },
        { 'Field': 'Date', 'Description': 'Payment date in YYYY-MM-DD format (required)', 'Example': '2024-01-31' },
        { 'Field': 'Notes', 'Description': 'Optional notes about the payment', 'Example': 'January salary payment' },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [
        { wch: 15 },  // Field
        { wch: 50 },  // Description
        { wch: 25 }   // Example
    ];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'vibes_salary_template.xlsx');
}
