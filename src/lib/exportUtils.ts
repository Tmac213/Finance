import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, endOfMonth } from 'date-fns';
import { BullionHoldings, Transaction, FixedDue, VibesSalary, Salary, MoneyHoldings } from '@/contexts/FinanceContext';

export function exportComprehensivePDF(
  transactions: Transaction[],
  fixedDues: FixedDue[],
  bullionHoldings: BullionHoldings,
  moneyHoldings: MoneyHoldings,
  vibesSalary: VibesSalary,
  salary: Salary
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
      ['Salary (Expected)', salary.expectedAmount.toFixed(2)],
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

  // Salary Section
  doc.text('Salary Payments', 14, (doc as any).lastAutoTable.finalY + 15);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Date', 'Amount', 'Notes']],
    body: salary.payments.map((p) => [
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

export interface SalaryDataForExport {
  expectedAmount: number;
  startDate?: string;
  monthlyExpectedAmounts?: Record<string, number>;
  payments: {
    id?: string;
    amount: number;
    date: string;
    notes?: string;
  }[];
}

export function getSalaryMonthlyOverviewRows(data: SalaryDataForExport) {
  const getExpectedForMonth = (monthYear: string) => {
    return data.monthlyExpectedAmounts?.[monthYear] || data.expectedAmount;
  };

  const startDateStr = data.startDate || '2023-05';
  const startDate = new Date(startDateStr + '-01');
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 2);

  const months: string[] = [];
  const current = new Date(startDate);
  while (current <= futureDate) {
    months.push(format(current, 'yyyy-MM'));
    current.setMonth(current.getMonth() + 1);
  }

  const allocation: Record<
    string,
    {
      allocated: number;
      payments: Array<{
        date: string;
        amount: number;
        originalAmount: number;
        id?: string;
      }>;
    }
  > = {};

  months.forEach((month) => {
    allocation[month] = { allocated: 0, payments: [] };
  });

  const sortedPayments = [...data.payments]
    .reverse()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedPayments.forEach((payment) => {
    let remainingAmount = payment.amount;

    for (const monthYear of months) {
      if (remainingAmount <= 0) break;

      const expected = getExpectedForMonth(monthYear);
      const alreadyAllocated = allocation[monthYear].allocated;

      if (alreadyAllocated < expected) {
        const needed = expected - alreadyAllocated;
        const allocateAmount = Math.min(remainingAmount, needed);

        allocation[monthYear].allocated += allocateAmount;
        allocation[monthYear].payments.push({
          date: payment.date,
          amount: allocateAmount,
          originalAmount: payment.amount,
          id: payment.id,
        });

        remainingAmount -= allocateAmount;
      }
    }

    if (remainingAmount > 0) {
      const paymentMonth = format(new Date(payment.date), 'yyyy-MM');
      if (allocation[paymentMonth]) {
        allocation[paymentMonth].allocated += remainingAmount;
        allocation[paymentMonth].payments.push({
          date: payment.date,
          amount: remainingAmount,
          originalAmount: payment.amount,
          id: payment.id,
        });
      }
    }
  });

  const getTiming = (
    monthYear: string,
    payments: Array<{ date: string; amount: number }>
  ) => {
    const dueDate = endOfMonth(new Date(monthYear + '-01'));
    const today = new Date();

    if (payments.length === 0) {
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) return `${diffDays} days late`;
      if (diffDays === 0) return 'due today';
      return `${Math.abs(diffDays)} days early`;
    }

    const earliestPaymentDate = new Date(
      Math.min(...payments.map((p) => new Date(p.date).getTime()))
    );
    const diffTime = earliestPaymentDate.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays} days late`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days early`;
    if (diffDays === 0 || diffDays === -1) return 'on time';
    return 'on time';
  };

  const getStatus = (totalPaid: number, expected: number) => {
    if (totalPaid >= expected) return 'fully paid';
    if (totalPaid > 0) return 'partially paid';
    return 'unpaid';
  };

  const sortedMonthYears = Object.keys(allocation).sort((a, b) =>
    a.localeCompare(b)
  );

  return sortedMonthYears.map((monthYear) => {
    const alloc = allocation[monthYear];
    const totalPaid = alloc.allocated;
    const expected = getExpectedForMonth(monthYear);
    const difference = totalPaid - expected;
    const dueDate = endOfMonth(new Date(monthYear + '-01'));
    const timing = getTiming(
      monthYear,
      alloc.payments.map((p) => ({
        ...p,
        amount: p.originalAmount,
      }))
    );
    const status = getStatus(totalPaid, expected);

    const paymentDetails = alloc.payments.length > 0
      ? alloc.payments
          .map((payment) => {
            const dateStr = format(new Date(payment.date), 'MMM dd, yyyy');
            const amtStr = `$${payment.amount.toFixed(2)}`;
            const origStr = payment.amount !== payment.originalAmount
              ? ` (from $${payment.originalAmount.toFixed(2)})`
              : '';
            return `${dateStr}: ${amtStr}${origStr}`;
          })
          .join('\n')
      : '-';

    return {
      monthYear,
      dueDate: format(dueDate, 'MMM dd, yyyy'),
      paid: `$${totalPaid.toFixed(2)}`,
      expected: `$${expected.toFixed(2)}`,
      paymentDetails,
      runningTotalAndDifference: `Total: $${totalPaid.toFixed(2)}\nDiff: $${difference.toFixed(2)}`,
      timing,
      status,
      totalPaidNum: totalPaid,
      expectedNum: expected,
      differenceNum: difference,
    };
  });
}

export function exportVibesSalaryToPDF(vibes: VibesSalary) {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'MMM dd, yyyy');

  // Title
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229);
  doc.text('Vibes Salary Report', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${dateStr}`, 14, 25);

  const totalPaid = vibes.payments.reduce((sum, p) => sum + p.amount, 0);
  const rows = getSalaryMonthlyOverviewRows(vibes);

  const currentMonth = format(new Date(), 'yyyy-MM');
  const totalUnpaid = rows
    .filter((r) => r.monthYear <= currentMonth)
    .reduce((sum, r) => sum + Math.max(0, r.expectedNum - r.totalPaidNum), 0);

  autoTable(doc, {
    startY: 30,
    head: [['Expected Salary', 'Total Received', 'Total Unpaid (To Date)']],
    body: [[
      `$${vibes.expectedAmount.toFixed(2)}`,
      `$${totalPaid.toFixed(2)}`,
      `$${totalUnpaid.toFixed(2)}`,
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [55, 65, 81],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 10,
      fontStyle: 'bold',
      textColor: [17, 24, 39],
      halign: 'center',
    },
  });

  const tableData = rows.map((r) => [
    r.dueDate,
    r.paid,
    r.expected,
    r.paymentDetails,
    r.runningTotalAndDifference,
    r.timing,
    r.status,
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [[
      'Due Date',
      'Paid',
      'Expected',
      'Payment Details',
      'Running Total & Difference',
      'Timing',
      'Status',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 18, halign: 'right' },
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 50 },
      4: { cellWidth: 32, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
    },
  });

  doc.save('vibes-salary.pdf');
}

export function exportVibesSalaryToExcel(vibes: VibesSalary) {
  const rows = getSalaryMonthlyOverviewRows(vibes);

  const overviewSheetData = [
    [
      'Due Date',
      'Paid',
      'Expected',
      'Payment Details',
      'Running Total & Difference',
      'Timing',
      'Status',
    ],
    ...rows.map((r) => [
      r.dueDate,
      r.paid,
      r.expected,
      r.paymentDetails,
      r.runningTotalAndDifference,
      r.timing,
      r.status,
    ]),
  ];

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewSheetData);
  overviewSheet['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 35 },
    { wch: 25 },
    { wch: 18 },
    { wch: 15 },
  ];

  const totalPaid = vibes.payments.reduce((s, p) => s + p.amount, 0);
  const currentMonth = format(new Date(), 'yyyy-MM');
  const totalUnpaid = rows
    .filter((r) => r.monthYear <= currentMonth)
    .reduce((sum, r) => sum + Math.max(0, r.expectedNum - r.totalPaidNum), 0);

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Metric', 'Value'],
    ['Expected Salary', vibes.expectedAmount],
    ['Total Received', totalPaid],
    ['Total Unpaid (To Date)', totalUnpaid],
  ]);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];

  const paymentsSheetData = [
    ['Date', 'Amount', 'Notes'],
    ...vibes.payments.map((p) => [p.date, p.amount, p.notes || '']),
  ];
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsSheetData);
  paymentsSheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, overviewSheet, 'Monthly Overview');
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(wb, paymentsSheet, 'Payments');
  XLSX.writeFile(wb, 'vibes-salary.xlsx');
}

export function exportSalaryToPDF(sal: Salary) {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'MMM dd, yyyy');

  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229);
  doc.text('Salary Report', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${dateStr}`, 14, 25);

  const totalPaid = sal.payments.reduce((sum, p) => sum + p.amount, 0);
  const rows = getSalaryMonthlyOverviewRows(sal);

  const currentMonth = format(new Date(), 'yyyy-MM');
  const totalUnpaid = rows
    .filter((r) => r.monthYear <= currentMonth)
    .reduce((sum, r) => sum + Math.max(0, r.expectedNum - r.totalPaidNum), 0);

  autoTable(doc, {
    startY: 30,
    head: [['Expected Salary', 'Total Received', 'Total Unpaid (To Date)']],
    body: [[
      `$${sal.expectedAmount.toFixed(2)}`,
      `$${totalPaid.toFixed(2)}`,
      `$${totalUnpaid.toFixed(2)}`,
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [55, 65, 81],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 10,
      fontStyle: 'bold',
      textColor: [17, 24, 39],
      halign: 'center',
    },
  });

  const tableData = rows.map((r) => [
    r.dueDate,
    r.paid,
    r.expected,
    r.paymentDetails,
    r.runningTotalAndDifference,
    r.timing,
    r.status,
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [[
      'Due Date',
      'Paid',
      'Expected',
      'Payment Details',
      'Running Total & Difference',
      'Timing',
      'Status',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 18, halign: 'right' },
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 50 },
      4: { cellWidth: 32, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
    },
  });

  doc.save('salary.pdf');
}

export function exportSalaryToExcel(sal: Salary) {
  const rows = getSalaryMonthlyOverviewRows(sal);

  const overviewSheetData = [
    [
      'Due Date',
      'Paid',
      'Expected',
      'Payment Details',
      'Running Total & Difference',
      'Timing',
      'Status',
    ],
    ...rows.map((r) => [
      r.dueDate,
      r.paid,
      r.expected,
      r.paymentDetails,
      r.runningTotalAndDifference,
      r.timing,
      r.status,
    ]),
  ];

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewSheetData);
  overviewSheet['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 35 },
    { wch: 25 },
    { wch: 18 },
    { wch: 15 },
  ];

  const totalPaid = sal.payments.reduce((s, p) => s + p.amount, 0);
  const currentMonth = format(new Date(), 'yyyy-MM');
  const totalUnpaid = rows
    .filter((r) => r.monthYear <= currentMonth)
    .reduce((sum, r) => sum + Math.max(0, r.expectedNum - r.totalPaidNum), 0);

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Metric', 'Value'],
    ['Expected Salary', sal.expectedAmount],
    ['Total Received', totalPaid],
    ['Total Unpaid (To Date)', totalUnpaid],
  ]);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];

  const paymentsSheetData = [
    ['Date', 'Amount', 'Notes'],
    ...sal.payments.map((p) => [p.date, p.amount, p.notes || '']),
  ];
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsSheetData);
  paymentsSheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, overviewSheet, 'Monthly Overview');
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(wb, paymentsSheet, 'Payments');
  XLSX.writeFile(wb, 'salary.xlsx');
}


