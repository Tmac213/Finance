import { useState } from 'react';
import { format, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Trash2, Edit, Calendar, Download, FileText, Loader2 } from 'lucide-react';
import { exportSalaryToPDF, exportSalaryToExcel } from '@/lib/exportUtils';
import { ExcelImportButton } from '@/components/ExcelImportButton';
import { generateSalaryTemplate } from '@/lib/templateUtils';
import { History as HistoryIcon } from 'lucide-react';
import { HistorySheet } from '@/components/HistorySheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useFinance } from '@/contexts/FinanceContext';

export default function Salary() {
  const { toast } = useToast();
  const {
    salary,
    updateSalary,
    addSalaryPayment,
    deleteSalaryPayment,
    updateSalaryPayment,
  } = useFinance();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [isMonthlySalaryDialogOpen, setIsMonthlySalaryDialogOpen] =
    useState(false);
  const [isBulkSalaryDialogOpen, setIsBulkSalaryDialogOpen] = useState(false);
  const [isAddMonthDialogOpen, setIsAddMonthDialogOpen] = useState(false);
  const [newMonth, setNewMonth] = useState('');
  const [newMonthSalary, setNewMonthSalary] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [expectedSalary, setExpectedSalary] = useState(
    salary.expectedAmount.toString()
  );
  const [expectedStartDate, setExpectedStartDate] = useState(
    salary.startDate || '2023-05'
  );
  const [monthlyExpectedSalary, setMonthlyExpectedSalary] = useState('');
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkSalaryAmount, setBulkSalaryAmount] = useState('');
  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');

  const getExpectedForMonth = (monthYear: string) => {
    return (
      salary.monthlyExpectedAmounts?.[monthYear] ||
      salary.expectedAmount
    );
  };

  // Generate months from startDate to current month + future months
  const generateMonthRange = () => {
    const months = [];
    const startDate = new Date((salary.startDate || '2023-05') + '-01');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2); // Add 2 years into the future

    const current = new Date(startDate);
    while (current <= futureDate) {
      months.push(format(current, 'yyyy-MM'));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const getDisplayedMonths = () => {
    const explicitMonths = Object.keys(salary.monthlyExpectedAmounts || {});
    const paymentMonths = salary.payments.map(p => format(new Date(p.date), 'yyyy-MM'));
    const allMonths = new Set([...explicitMonths, ...paymentMonths]);
    const startMonth = salary.startDate || '2023-05';
    return Array.from(allMonths).filter(m => m >= startMonth).sort();
  };

  // Allocate payments FIFO (First In, First Out) to earliest unpaid months
  const allocatePaymentsToMonths = () => {
    const months = getDisplayedMonths();
    const allocation: Record<
      string,
      {
        allocated: number;
        payments: Array<{
          date: string;
          amount: number;
          originalAmount: number;
          id: string;
        }>;
      }
    > = {};

    // Initialize months
    months.forEach((month) => {
      allocation[month] = { allocated: 0, payments: [] };
    });

    // Sort payments by date (earliest first)
    const sortedPayments = [...salary.payments]
      .reverse()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Allocate payments FIFO to earliest months
    sortedPayments.forEach((payment) => {
      let remainingAmount = payment.amount;

      // Find the earliest months that still need payment
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

      // If there's still remaining amount after allocating to all months,
      // add it to the payment month as originally intended
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

    return allocation;
  };

  const paymentAllocation = allocatePaymentsToMonths();
  const sortedMonthYears = Object.keys(paymentAllocation).sort((a, b) =>
    a.localeCompare(b)
  );

  // Calculate exact total unpaid amount for months up to today
  const currentMonth = format(new Date(), 'yyyy-MM');
  const totalUnpaidAmount = sortedMonthYears.reduce((sum, monthYear) => {
    // Only count up to current month
    if (monthYear > currentMonth) return sum;

    const allocation = paymentAllocation[monthYear];
    const totalPaidForMonth = allocation.allocated;
    const expected = getExpectedForMonth(monthYear);

    // Calculate remaining amount for this month
    const remaining = Math.max(0, expected - totalPaidForMonth);
    return sum + remaining;
  }, 0);

  const totalPaid = salary.payments.reduce((sum, p) => sum + p.amount, 0);

  const getTiming = (
    monthYear: string,
    payments: typeof salary.payments
  ) => {
    const dueDate = endOfMonth(new Date(monthYear + '-01'));
    const today = new Date();

    if (payments.length === 0) {
      // For unpaid months, calculate days past due from today
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) return `${diffDays} days late`;
      if (diffDays === 0) return 'due today';
      return `${Math.abs(diffDays)} days early`;
    }

    // Find the earliest payment date
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

  const handleDeleteMonth = async (monthYear: string) => {
    // Check if the month has any payments
    const hasPayments = paymentAllocation[monthYear]?.payments?.length > 0;
    if (hasPayments) {
      toast({
        title: 'Cannot Remove Month',
        description: 'This month has payments. Please delete the payments first.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove ${format(new Date(monthYear + '-01'), 'MMM yyyy')}?`)) return;
    setIsLoading(true);
    setLoadingAction('delete-month');
    try {
      const updatedMonthly = { ...salary.monthlyExpectedAmounts };
      delete updatedMonthly[monthYear];
      await updateSalary({ monthlyExpectedAmounts: updatedMonthly });
      toast({
        title: 'Month Removed',
        description: `${format(new Date(monthYear + '-01'), 'MMM yyyy')} has been removed.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove month. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleDeletePayment = async (paymentId: string, amountToRemove: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    setIsLoading(true);
    setLoadingAction('delete-payment');
    try {
      const originalPayment = salary.payments.find(p => p.id === paymentId);

      if (!originalPayment) {
        throw new Error('Payment not found');
      }

      // Calculate new amount
      // Floating point correction
      const newAmount = Math.round((originalPayment.amount - amountToRemove) * 100) / 100;

      if (newAmount <= 0) {
        // If nothing left, delete the payment entirely
        await deleteSalaryPayment(paymentId);
        toast({
          title: 'Payment Deleted',
          description: 'The payment has been completely removed.',
        });
      } else {
        // Otherwise just update the amount
        await updateSalaryPayment(paymentId, { amount: newAmount });
        toast({
          title: 'Payment Updated',
          description: `Payment amount reduced by $${amountToRemove.toFixed(2)}. New total: $${newAmount.toFixed(2)}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleUpdateSalary = async () => {
    if (!expectedSalary) {
      toast({
        title: 'Error',
        description: 'Please enter a valid salary amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setLoadingAction('update-salary');
    try {
      await updateSalary({ 
        expectedAmount: parseFloat(expectedSalary),
        startDate: expectedStartDate || '2023-05' 
      });
      toast({
        title: 'Salary Updated',
        description: `Expected salary updated to $${expectedSalary}`,
      });
      setIsSalaryDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update salary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleAddPayment = async () => {
    if (!paymentData.amount || !paymentData.date) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setLoadingAction('add-payment');
    try {
      await addSalaryPayment({
        amount: parseFloat(paymentData.amount),
        date: paymentData.date,
        notes: paymentData.notes,
      });

      toast({
        title: 'Payment Added',
        description: `Salary payment of $${paymentData.amount} recorded successfully.`,
      });

      setIsPaymentDialogOpen(false);
      setPaymentData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleUpdateMonthlySalary = async () => {
    if (!monthlyExpectedSalary || !selectedMonth) {
      toast({
        title: 'Error',
        description: 'Please select a month and enter a valid salary amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setLoadingAction('update-monthly-salary');
    try {
      const updatedMonthlySalaries = {
        ...salary.monthlyExpectedAmounts,
        [selectedMonth]: parseFloat(monthlyExpectedSalary),
      };

      await updateSalary({
        monthlyExpectedAmounts: updatedMonthlySalaries,
      });
      toast({
        title: 'Monthly Salary Updated',
        description: `Expected salary for ${format(new Date(selectedMonth + '-01'), 'MMM yyyy')} updated to $${monthlyExpectedSalary}`,
      });
      setIsMonthlySalaryDialogOpen(false);
      setSelectedMonth('');
      setMonthlyExpectedSalary('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update monthly salary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleBulkUpdateSalaries = async () => {
    if (!bulkStartDate || !bulkSalaryAmount) {
      toast({
        title: 'Error',
        description:
          'Please select a start date and enter a valid salary amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setLoadingAction('bulk-update-salaries');
    try {
      const startMonth = format(new Date(bulkStartDate + '-01'), 'yyyy-MM');
      const months = generateMonthRange();
      const startIndex = months.indexOf(startMonth);

      if (startIndex === -1) {
        toast({
          title: 'Error',
          description: 'Invalid start date selected.',
          variant: 'destructive',
        });
        return;
      }

      const updatedMonthlySalaries = { ...salary.monthlyExpectedAmounts };

      // Update all months from the start date onwards
      for (let i = startIndex; i < months.length; i++) {
        updatedMonthlySalaries[months[i]] = parseFloat(bulkSalaryAmount);
      }

      await updateSalary({
        monthlyExpectedAmounts: updatedMonthlySalaries,
      });
      toast({
        title: 'Bulk Salary Update Completed',
        description: `All salaries from ${format(new Date(bulkStartDate + '-01'), 'MMM yyyy')} onwards updated to $${bulkSalaryAmount}`,
      });
      setIsBulkSalaryDialogOpen(false);
      setBulkStartDate('');
      setBulkSalaryAmount('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update salaries. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleBulkImport = async (data: any[]) => {
    const importPromises = data.map((row) =>
      addSalaryPayment({
        amount: row.amount,
        date: row.date,
        notes: row.notes || '',
      })
    );

    await Promise.all(importPromises);
  };

  const handleAddMonth = async () => {
    if (!newMonth || !newMonthSalary) {
      toast({
        title: 'Error',
        description: 'Please select a month and enter a salary amount.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setLoadingAction('add-month');
    try {
      const updatedMonthly = {
        ...(salary.monthlyExpectedAmounts || {}),
        [newMonth]: parseFloat(newMonthSalary),
      };
      await updateSalary({ monthlyExpectedAmounts: updatedMonthly });
      toast({
        title: 'Month Added',
        description: `Expected salary for ${format(new Date(newMonth + '-01'), 'MMM yyyy')} set to $${newMonthSalary}`,
      });
      setIsAddMonthDialogOpen(false);
      setNewMonth('');
      setNewMonthSalary('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add month salary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Salary</h2>
            <p className="text-muted-foreground">Track your salary payments</p>
          </div>
          <div className="flex gap-2 items-center">
            <ExcelImportButton
              expectedColumns={['amount', 'date', 'notes']}
              parseRow={(row: any) => {
                const amount = typeof row['Amount'] === 'number'
                  ? row['Amount']
                  : parseFloat(String(row['Amount'] || row['amount'] || '0').replace(/[^0-9.-]/g, ''));
                const dateValue = row['Date'] || row['date'] || '';
                const notes = String(row['Notes'] || row['notes'] || '').trim();

                // Parse date
                let parsedDate = '';
                if (dateValue) {
                  const dateObj = new Date(dateValue);
                  if (!isNaN(dateObj.getTime())) {
                    parsedDate = dateObj.toISOString().split('T')[0];
                  }
                }

                return {
                  amount: isNaN(amount) ? 0 : amount,
                  date: parsedDate || new Date().toISOString().split('T')[0],
                  notes,
                };
              }}
              validateRow={(row: any) => {
                const errors: string[] = [];

                if (row.amount <= 0) errors.push('Amount must be greater than 0');
                if (!row.date) errors.push('Date is required');

                return { valid: errors.length === 0, errors };
              }}
              onImport={handleBulkImport}
              templateDownloadFn={generateSalaryTemplate}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportSalaryToPDF(salary)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportSalaryToExcel(salary)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Dialog
              open={isSalaryDialogOpen}
              onOpenChange={setIsSalaryDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setExpectedSalary(salary.expectedAmount.toString());
                    setExpectedStartDate(salary.startDate || '2023-05');
                  }}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Update Expected Salary
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Expected Salary</DialogTitle>
                  <DialogDescription>
                    Set your expected monthly salary amount.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected-salary">Expected Salary</Label>
                    <Input
                      id="expected-salary"
                      type="number"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected-start-date">Salary Start Date</Label>
                    <Input
                      id="expected-start-date"
                      type="month"
                      value={expectedStartDate}
                      onChange={(e) => setExpectedStartDate(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleUpdateSalary} className="w-full" disabled={isLoading && loadingAction === 'update-salary'}>
                    {isLoading && loadingAction === 'update-salary' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Salary'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog
              open={isMonthlySalaryDialogOpen}
              onOpenChange={setIsMonthlySalaryDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Update Monthly Salary
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Monthly Expected Salary</DialogTitle>
                  <DialogDescription>
                    Set the expected salary for a specific month.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="month-select">Select Month</Label>
                    <Select
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a month" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateMonthRange().map((month) => (
                          <SelectItem key={month} value={month}>
                            {format(new Date(month + '-01'), 'MMM yyyy')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly-expected-salary">
                      Expected Salary for{' '}
                      {selectedMonth
                        ? format(new Date(selectedMonth + '-01'), 'MMM yyyy')
                        : 'Selected Month'}
                    </Label>
                    <Input
                      id="monthly-expected-salary"
                      type="number"
                      value={monthlyExpectedSalary}
                      onChange={(e) => setMonthlyExpectedSalary(e.target.value)}
                      placeholder="Enter salary amount"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateMonthlySalary}
                    className="w-full"
                    disabled={!selectedMonth || !monthlyExpectedSalary || (isLoading && loadingAction === 'update-monthly-salary')}
                  >
                    {isLoading && loadingAction === 'update-monthly-salary' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Monthly Salary'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog
              open={isBulkSalaryDialogOpen}
              onOpenChange={setIsBulkSalaryDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Bulk Update Salaries
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Update Salaries</DialogTitle>
                  <DialogDescription>
                    Update expected salaries for all months from a specific date
                    onwards.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-start-date">Start Date</Label>
                    <Input
                      id="bulk-start-date"
                      type="month"
                      value={bulkStartDate}
                      onChange={(e) => setBulkStartDate(e.target.value)}
                      min="2023-05"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk-salary-amount">New Salary Amount</Label>
                    <Input
                      id="bulk-salary-amount"
                      type="number"
                      value={bulkSalaryAmount}
                      onChange={(e) => setBulkSalaryAmount(e.target.value)}
                      placeholder="Enter salary amount"
                    />
                  </div>
                  <Button
                    onClick={handleBulkUpdateSalaries}
                    className="w-full"
                    disabled={!bulkStartDate || !bulkSalaryAmount || (isLoading && loadingAction === 'bulk-update-salaries')}
                  >
                    {isLoading && loadingAction === 'bulk-update-salaries' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update All Salaries From Date'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddMonthDialogOpen} onOpenChange={setIsAddMonthDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Month
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Monthly Salary</DialogTitle>
                  <DialogDescription>
                    Define expected salary for a new month.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-month-select">Select Month</Label>
                    <Select value={newMonth} onValueChange={setNewMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a month" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateMonthRange().map((month) => (
                          <SelectItem key={month} value={month}>
                            {format(new Date(month + '-01'), 'MMM yyyy')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-month-salary">Expected Salary</Label>
                    <Input
                      id="new-month-salary"
                      type="number"
                      value={newMonthSalary}
                      onChange={(e) => setNewMonthSalary(e.target.value)}
                      placeholder="Enter salary amount"
                    />
                  </div>
                  <Button
                    onClick={handleAddMonth}
                    className="w-full"
                    disabled={!newMonth || !newMonthSalary || (isLoading && loadingAction === 'add-month')}
                  >
                    {isLoading && loadingAction === 'add-month' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Month'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog
              open={isPaymentDialogOpen}
              onOpenChange={setIsPaymentDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Salary Payment</DialogTitle>
                  <DialogDescription>
                    Record a new salary payment received.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, amount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Payment Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={paymentData.date}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={paymentData.notes}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, notes: e.target.value })
                      }
                    />
                  </div>
                  <Button onClick={handleAddPayment} className="w-full" disabled={isLoading && loadingAction === 'add-payment'}>
                    {isLoading && loadingAction === 'add-payment' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Payment'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Expected Salary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${salary.expectedAmount.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">
                ${totalPaid.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Unpaid Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-warning">
                  ${totalUnpaidAmount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total outstanding for current and past months
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-white">Monthly Salary Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-500 to-cyan-500">
                <TableRow>
                  <TableHead className="text-white font-semibold">Due</TableHead>
                  <TableHead className="text-white font-semibold">Paid</TableHead>
                  <TableHead className="text-white font-semibold">
                    Expected
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Due Date
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Payment Details
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Running Total &amp; Difference
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Timing
                  </TableHead>
                  <TableHead className="text-white font-semibold">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMonthYears.map((monthYear, index) => {
                  const allocation = paymentAllocation[monthYear];
                  const totalPaid = allocation.allocated;
                  const expected = getExpectedForMonth(monthYear);
                  const difference = totalPaid - expected;
                  const dueDate = endOfMonth(new Date(monthYear + '-01'));
                  const timing = getTiming(
                    monthYear,
                    allocation.payments.map((p) => ({
                      ...p,
                      amount: p.originalAmount,
                    }))
                  );
                  const status = getStatus(totalPaid, expected);

                  return (
                    <TableRow
                      key={monthYear}
                      className={`${index % 2 === 0 ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gradient-to-r from-purple-50 to-pink-50'} hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-colors duration-200`}
                    >
                      <TableCell className="font-medium text-blue-800">
                        <div className="flex items-center gap-2">
                          {format(new Date(monthYear + '-01'), 'MMM yyyy')}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMonth(monthYear)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                            disabled={isLoading && loadingAction === 'delete-month'}
                            title="Delete Month"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        ${totalPaid.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-purple-600 font-semibold">
                        ${expected.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {format(dueDate, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {allocation.payments.map((payment) => (
                            <div
                              key={`${payment.id}-${monthYear}`}
                              className="flex items-center justify-between text-sm bg-gradient-to-r from-green-100 to-emerald-100 p-2 rounded-md"
                            >
                              <span className="text-green-800">
                                {format(new Date(payment.date), 'MMM dd, yyyy')}:
                                ${payment.amount.toFixed(2)}
                                {payment.amount !== payment.originalAmount && (
                                  <span className="text-xs text-green-600 ml-1">
                                    {`(from $${payment.originalAmount.toFixed(2)})`}
                                  </span>
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePayment(payment.id, payment.amount)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                disabled={isLoading && loadingAction === 'delete-payment'}
                              >
                                {isLoading && loadingAction === 'delete-payment' ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold text-blue-600">
                            Total: ${totalPaid.toFixed(2)}
                          </div>
                          <div
                            className={`font-medium ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            Diff: ${difference.toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            timing.includes('late') && status === 'unpaid'
                              ? 'destructive'
                              : timing === 'due today' ||
                                (timing.includes('days early') &&
                                  status === 'unpaid')
                              ? 'secondary'
                              : timing.includes('late')
                                ? 'destructive'
                                : timing === 'on time'
                                  ? 'default'
                                  : 'secondary'
                          }
                          className={
                            timing.includes('late') && status === 'unpaid'
                              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                              : timing === 'due today' ||
                                (timing.includes('days early') &&
                                  status === 'unpaid')
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                              : timing.includes('late')
                                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                : timing === 'on time'
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          }
                        >
                          {timing}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            status === 'fully paid'
                              ? 'default'
                              : status === 'partially paid'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={`${status === 'fully paid' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : status === 'partially paid' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'} border-0`}
                        >
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Spacer for fixed footer */}
        <div className="h-24"></div>

        <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-2xl">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-500/20 px-6 py-5 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              <HistoryIcon className="mr-2 h-4 w-4 text-indigo-100" />
              Audit History &amp; Activity Logs
            </Button>
          </div>
        </footer>
      </div>

      <HistorySheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entityType="salary"
        title="Salary History"
      />
    </>
  );
}
