import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BullionHoldings, Transaction, FixedDue, VibesSalary, MoneyHoldings } from '@/contexts/FinanceContext';

export function exportComprehensivePDF(
  transactions: Transaction[],
  fixedDues: FixedDue[],
  bullionHoldings: BullionHoldings,
  moneyHoldings: MoneyHoldings,
  vibesSalary: VibesSalary
) {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString();

  // Title Page
  doc.setFontSize(22);
  doc.setTextColor(63, 81, 181); // Indigo color
  doc.text('MistHub Financial Report', 105, 40, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${dateStr}`, 105, 50, { align: 'center' });

  // Summary Table
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Portfolio Summary', 14, 70);

  const bullionValue = bullionHoldings.reduce((sum, h) => sum + h.pureOunces, 0);
  const totalTransactions = transactions.length;
  const unpaidDues = fixedDues.filter(d => !d.isPaid).length;

  autoTable(doc, {
    startY: 75,
    head: [['Metric', 'Value']],
    body: [
      ['Total Pure Bullion (Oz)', bullionValue.toFixed(4)],
      ['Total Transactions', totalTransactions.toString()],
      ['Pending Fixed Dues', unpaidDues.toString()],
      ['Vibes Salary (Expected)', vibesSalary.expectedAmount.toFixed(2)],
    ],
    theme: 'striped',
  });

  // Bullion Section
  doc.addPage();
  doc.text('Bullion Holdings', 14, 20);
  autoTable(doc, {
    startY: 25,
    head: [['Type', 'Form', 'Amount', 'Unit', 'Purity', 'Pure Oz']],
    body: bullionHoldings.map((h) => [
      h.type,
      h.form,
      h.amount,
      h.unit,
      h.purity,
      h.pureOunces.toFixed(4),
    ]),
  });

  // Cash Section
  doc.text('Cash & Money Holdings', 14, (doc as any).lastAutoTable.finalY + 15);
  const currencyRows = Object.entries(moneyHoldings.holdings).map(([code, amount]) => [
    code,
    amount.toLocaleString(),
  ]);

  if (currencyRows.length > 0) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Currency', 'Total Amount']],
      body: currencyRows,
    });
  } else {
    doc.setFontSize(10);
    doc.text('No cash holdings recorded.', 14, (doc as any).lastAutoTable.finalY + 20);
  }

  // Transactions Section
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Recent Transactions', 14, 20);
  autoTable(doc, {
    startY: 25,
    head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
    body: transactions.slice(0, 50).map((t) => [
      t.date,
      t.description,
      t.category,
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.amount.toFixed(2),
    ]),
  });

  // Fixed Dues Section
  doc.addPage();
  doc.text('Fixed Dues', 14, 20);
  autoTable(doc, {
    startY: 25,
    head: [['Name', 'Amount', 'Recurrence', 'Due Date', 'Status']],
    body: fixedDues.map((d) => [
      d.name,
      d.amount.toFixed(2),
      d.recurrence,
      d.dueDate,
      d.isPaid ? 'Paid' : 'Pending',
    ]),
  });

  // Vibes Salary Section
  doc.text('Vibes Salary Payments', 14, (doc as any).lastAutoTable.finalY + 15);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Date', 'Amount', 'Notes']],
    body: vibesSalary.payments.map((p) => [
      p.date,
      p.amount.toFixed(2),
      p.notes || '',
    ]),
  });

  doc.save(`mist-hub-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportBullionToPDF(holdings: BullionHoldings) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Bullion Holdings', 14, 18);

  const rows = holdings.map((h) => [
    h.type,
    h.form,
    h.amount,
    h.unit,
    h.purity,
    h.pureOunces.toFixed(4),
  ]);

  autoTable(doc, {
    startY: 24,
    head: [['Type', 'Form', 'Amount', 'Unit', 'Purity (K)', 'Pure Oz']],
    body: rows,
  });

  doc.save('bullion-holdings.pdf');
}

export function exportBullionToExcel(holdings: BullionHoldings) {
  const worksheetData = [
    ['Type', 'Form', 'Amount', 'Unit', 'Purity (K)', 'Pure Oz'],
    ...holdings.map((h) => [
      h.type,
      h.form,
      h.amount,
      h.unit,
      h.purity,
      h.pureOunces,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bullion');
  XLSX.writeFile(workbook, 'bullion-holdings.xlsx');
}

export function exportTransactionsToPDF(transactions: Transaction[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Transactions', 14, 18);

  const rows = transactions.map((t) => [
    t.type,
    t.description,
    t.category,
    t.date,
    t.amount.toFixed(2),
  ]);

  autoTable(doc, {
    startY: 24,
    head: [['Type', 'Description', 'Category', 'Date', 'Amount']],
    body: rows,
  });

  doc.save('transactions.pdf');
}

export function exportTransactionsToExcel(transactions: Transaction[]) {
  const worksheetData = [
    ['Type', 'Description', 'Category', 'Date', 'Amount'],
    ...transactions.map((t) => [
      t.type,
      t.description,
      t.category,
      t.date,
      t.amount,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  XLSX.writeFile(workbook, 'transactions.xlsx');
}

export function exportFixedDuesToPDF(dues: FixedDue[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Fixed Dues', 14, 18);

  const rows = dues.map((d) => [
    d.name,
    d.amount.toFixed(2),
    d.recurrence,
    d.startDate,
    d.dueDate,
    d.isPaid ? 'Yes' : 'No',
    d.paidDate || '-',
  ]);

  autoTable(doc, {
    startY: 24,
    head: [['Name', 'Amount', 'Recurrence', 'Start', 'End', 'Paid', 'Paid Date']],
    body: rows,
  });

  doc.save('fixed-dues.pdf');
}

export function exportFixedDuesToExcel(dues: FixedDue[]) {
  const worksheetData = [
    ['Name', 'Amount', 'Recurrence', 'Start', 'End', 'Paid', 'Paid Date'],
    ...dues.map((d) => [
      d.name,
      d.amount,
      d.recurrence,
      d.startDate,
      d.dueDate,
      d.isPaid ? 'Yes' : 'No',
      d.paidDate || '',
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fixed Dues');
  XLSX.writeFile(workbook, 'fixed-dues.xlsx');
}

export function exportVibesSalaryToPDF(vibes: VibesSalary) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Vibes Salary Summary', 14, 18);

  autoTable(doc, {
    startY: 24,
    head: [['Expected Amount', 'Total Payments']],
    body: [[
      vibes.expectedAmount.toFixed(2),
      vibes.payments.reduce((s, p) => s + p.amount, 0).toFixed(2),
    ]],
  });

  const paymentRows = vibes.payments.map((p) => [
    p.date,
    p.amount.toFixed(2),
    p.notes || '',
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [['Date', 'Amount', 'Notes']],
    body: paymentRows,
  });

  doc.save('vibes-salary.pdf');
}

export function exportVibesSalaryToExcel(vibes: VibesSalary) {
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Expected Amount', 'Total Payments'],
    [vibes.expectedAmount, vibes.payments.reduce((s, p) => s + p.amount, 0)],
  ]);

  const paymentsSheet = XLSX.utils.aoa_to_sheet([
    ['Date', 'Amount', 'Notes'],
    ...vibes.payments.map((p) => [p.date, p.amount, p.notes || '']),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(wb, paymentsSheet, 'Payments');
  XLSX.writeFile(wb, 'vibes-salary.xlsx');
}


