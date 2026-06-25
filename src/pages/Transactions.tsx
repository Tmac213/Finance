import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, Trash, Download, FileText, ArrowUpDown, ArrowUp, ArrowDown, History as HistoryIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { exportTransactionsToPDF, exportTransactionsToExcel } from '@/lib/exportUtils';
import { ExcelImportButton } from '@/components/ExcelImportButton';
import { generateTransactionsTemplate } from '@/lib/templateUtils';
import { RecurringTransactionsList } from '@/components/RecurringTransactionsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HistorySheet } from '@/components/HistorySheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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

export default function Transactions() {
  const { toast } = useToast();
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAllTransactions,
    getTotalIncome,
    getTotalExpenses,
    getTotalBalance,
    syncData,
    moneyHoldings,
  } = useFinance();

  // Calculate total USD value of holdings
  const calculateTotalHoldings = () => {
    if (!moneyHoldings || !moneyHoldings.currencyData) return 0;
    let totalInUsd = 0;
    moneyHoldings.currencyData.forEach((c) => {
      const key = c.code.toLowerCase();
      const holding = moneyHoldings.holdings[key] || 0;
      totalInUsd += holding * c.exchangeRateToUsd;
    });
    return totalInUsd;
  };

  const totalUsdHoldings = calculateTotalHoldings();
  const currentTotalBalance = getTotalBalance();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Find LBP rate from moneyHoldings or fallback to 89500
  const lbpCurrency = moneyHoldings.currencyData?.find(c => c.code === 'LBP');
  const lbpRate = lbpCurrency ? (1 / lbpCurrency.exchangeRateToUsd) : 89500;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    amount: '',
    amountLbp: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });


  useEffect(() => {
    let hasSyncedOnMount = false;
    let syncTimeout: NodeJS.Timeout | null = null;

    const syncOnVisible = async () => {
      if (!document.hidden && navigator.onLine) {
        console.log('[Transactions] Page visible, triggering sync...');
        try {
          await syncData();
        } catch (error: any) {
          // Don't log auth redirect errors as they're expected
          if (!error?.isAuthRedirect) {
            console.error('[Transactions] Error syncing on visible:', error);
          }
        }
      }
    };

    // Sync after a short delay on mount (to avoid conflicts with other syncs)
    if (!hasSyncedOnMount) {
      syncTimeout = setTimeout(() => {
        hasSyncedOnMount = true;
        syncOnVisible();
      }, 1000);
    }

    // Also sync when page becomes visible (debounced)
    let visibilityTimeout: NodeJS.Timeout | null = null;
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Clear any pending sync
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }
        // Debounce visibility sync
        visibilityTimeout = setTimeout(() => {
          syncOnVisible();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (syncTimeout) clearTimeout(syncTimeout);
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncData]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const filteredTransactions = useMemo(() => {
    const filtered = transactions
      .filter((t) => filterType === 'all' || t.type === filterType)
      .filter((t) =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Sort transactions based on sortConfig
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'type':
            aValue = a.type.toLowerCase();
            bValue = b.type.toLowerCase();
            break;
          case 'description':
            aValue = a.description.toLowerCase();
            bValue = b.description.toLowerCase();
            break;
          case 'category':
            aValue = a.category.toLowerCase();
            bValue = b.category.toLowerCase();
            break;
          case 'date':
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
          case 'amount':
            aValue = a.amount;
            bValue = b.amount;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [transactions, filterType, searchQuery, sortConfig]);

  const handleOpenDialog = (transactionId?: string) => {
    if (transactionId) {
      const transaction = transactions.find((t) => t.id === transactionId);
      if (transaction) {
        setEditingTransaction(transactionId);
        setFormData({
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount.toString(),
          amountLbp: (transaction.amount * lbpRate).toFixed(0),
          category: transaction.category,
          date: transaction.date,
        });
      }
    } else {
      setEditingTransaction(null);
      setFormData({
        type: 'income',
        description: '',
        amount: '',
        amountLbp: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setIsDialogOpen(true);
  };

  const handleAmountChange = (value: string, currency: 'usd' | 'lbp') => {
    if (currency === 'usd') {
      const usdAmount = value;
      const lbpAmount = value ? (parseFloat(value) * lbpRate).toFixed(0) : '';
      setFormData({ ...formData, amount: usdAmount, amountLbp: lbpAmount });
    } else {
      const lbpAmount = value;
      const usdAmount = value ? (parseFloat(value) / lbpRate).toFixed(2) : '';
      setFormData({ ...formData, amountLbp: lbpAmount, amount: usdAmount });
    }
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const finalAmount = parseFloat(formData.amount);
      if (editingTransaction) {
        await updateTransaction(editingTransaction, {
          type: formData.type,
          description: formData.description,
          amount: finalAmount,
          category: formData.category,
          date: formData.date,
        });

        toast({
          title: 'Transaction Updated',
          description: 'Transaction has been updated successfully.',
        });
      } else {
        await addTransaction({
          type: formData.type,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date,
          source: 'transaction',
        });
        // Only show success toast if not redirecting due to auth
        // (check if we're still on the same page - if redirect happened, we won't be)
        if (window.location.pathname !== '/login') {
          toast({
            title: 'Transaction Added',
            description: `${formData.type === 'income' ? 'Income' : 'Expense'} of $${formData.amount} added successfully.`,
          });
        }
      }
      setIsDialogOpen(false);
      setEditingTransaction(null);
    } catch (error: any) {
      // Don't show error toast if we're redirecting due to auth failure
      const errorMessage = error?.message || String(error);
      const isAuthError = error?.isAuthRedirect ||
        errorMessage.includes('Invalid or expired token') ||
        errorMessage.includes('Session expired') ||
        error?.status === 401;

      if (isAuthError) {
        // Redirect is happening, don't show error or close dialog
        // The redirect will take the user to login page
        return;
      }
      console.error('Error saving transaction:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    const transaction = transactions.find((t) => t.id === id);
    if (transaction?.source && transaction.source !== 'transaction') {
      toast({
        title: 'Cannot Delete',
        description:
          'This transaction is linked to a Fixed Due or Vibes Salary payment and cannot be deleted directly.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteTransaction(id);
      // Only show success toast if not redirecting due to auth
      // (check if we're still on the same page - if redirect happened, we won't be)
      if (window.location.pathname !== '/login') {
        toast({
          title: 'Transaction Deleted',
          description: 'Transaction has been deleted successfully.',
        });
      }
    } catch (error: any) {
      // Don't show error toast if we're redirecting due to auth failure
      const errorMessage = error?.message || String(error);
      const isAuthError = error?.isAuthRedirect ||
        errorMessage.includes('Invalid or expired token') ||
        errorMessage.includes('Session expired') ||
        error?.status === 401;

      if (isAuthError) {
        // Redirect is happening, don't show error
        // The redirect will take the user to login page
        return;
      }

      let userMessage = 'Failed to delete transaction. Please try again.';

      // Provide more specific error messages
      if (errorMessage.includes('Network error')) {
        userMessage = 'Network error. The transaction will be deleted when connection is restored.';
      } else if (error?.status === 404) {
        userMessage = 'Transaction not found. It may have already been deleted.';
      }

      toast({
        title: 'Error',
        description: userMessage,
        variant: 'destructive',
      });
    }
  };

  const handleBulkImport = async (data: any[]) => {
    const importPromises = data.map((row) =>
      addTransaction({
        type: row.type,
        description: row.description,
        amount: row.amount,
        category: row.category,
        date: row.date,
        source: 'transaction',
      })
    );

    await Promise.all(importPromises);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">
              Manage all your income and expenses
            </p>
          </div>
        </div>

        {Math.abs(currentTotalBalance - totalUsdHoldings) > 0.009 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Balance Mismatch</AlertTitle>
            <AlertDescription>
              Your total balance (${currentTotalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              does not match your cash holdings (${totalUsdHoldings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).{' '}
              {currentTotalBalance > totalUsdHoldings
                ? `You need to increase your holdings by $${(currentTotalBalance - totalUsdHoldings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
                : `You need to decrease your holdings by $${(totalUsdHoldings - currentTotalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`}{' '}
              Please update your holdings or transactions.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="recurring">Recurring Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  <ExcelImportButton
                    expectedColumns={['type', 'description', 'category', 'date', 'amount']}
                    parseRow={(row: any) => {
                      const type = String(row['Type'] || row['type'] || '').toLowerCase().trim();
                      const description = String(row['Description'] || row['description'] || '').trim();
                      const category = String(row['Category'] || row['category'] || '').trim();
                      const paidOn = row['Paid On'] || row['date'] || row['Date'] || '';
                      const paidDollars = row['Paid Dollars'] || row['amount'] || row['Amount'] || 0;

                      // Parse date
                      let date = '';
                      if (paidOn) {
                        const parsedDate = new Date(paidOn);
                        if (!isNaN(parsedDate.getTime())) {
                          date = parsedDate.toISOString().split('T')[0];
                        }
                      }

                      // Parse amount
                      const amount = typeof paidDollars === 'number'
                        ? paidDollars
                        : parseFloat(String(paidDollars).replace(/[^0-9.-]/g, ''));

                      return {
                        type: type === 'income' || type === 'expense' ? type : 'expense',
                        description,
                        category,
                        date: date || new Date().toISOString().split('T')[0],
                        amount: isNaN(amount) ? 0 : amount,
                      };
                    }}
                    validateRow={(row: any) => {
                      const errors: string[] = [];

                      if (!row.description) errors.push('Description is required');
                      if (row.amount <= 0) errors.push('Amount must be greater than 0');
                      if (!['income', 'expense'].includes(row.type)) {
                        errors.push('Type must be Income or Expense');
                      }

                      return { valid: errors.length === 0, errors };
                    }}
                    onImport={handleBulkImport}
                    templateDownloadFn={generateTransactionsTemplate}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportTransactionsToPDF(transactions)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportTransactionsToExcel(transactions)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHistoryOpen(true)}
                  >
                    <HistoryIcon className="mr-2 h-4 w-4" />
                    History
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteAllDialogOpen(true)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete All
                  </Button>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Transaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingTransaction ? 'Edit' : 'Add New'} Transaction
                        </DialogTitle>
                        <DialogDescription>
                          {editingTransaction
                            ? 'Update the transaction details below.'
                            : 'Add a new income or expense transaction.'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Select
                            value={formData.type}
                            onValueChange={(value: 'income' | 'expense') =>
                              setFormData({ ...formData, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({ ...formData, description: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount (USD)</Label>
                            <Input
                              id="amount"
                              type="number"
                              placeholder="0.00"
                              value={formData.amount}
                              onChange={(e) => handleAmountChange(e.target.value, 'usd')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="amountLbp">Amount (LBP)</Label>
                            <Input
                              id="amountLbp"
                              type="number"
                              placeholder="0"
                              value={formData.amountLbp}
                              onChange={(e) => handleAmountChange(e.target.value, 'lbp')}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={formData.category}
                            onChange={(e) =>
                              setFormData({ ...formData, category: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              setFormData({ ...formData, date: e.target.value })
                            }
                          />
                        </div>
                        <Button onClick={handleSubmit} className="w-full">
                          {editingTransaction ? 'Update' : 'Add'} Transaction
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
            <Dialog
              open={isDeleteAllDialogOpen}
              onOpenChange={setIsDeleteAllDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Delete All</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete all transactions? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteAllDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        await deleteAllTransactions();
                        // Only show success toast if not redirecting due to auth
                        if (window.location.pathname !== '/login') {
                          toast({
                            title: 'All Transactions Deleted',
                            description:
                              'All transactions have been deleted successfully.',
                          });
                        }
                        setIsDeleteAllDialogOpen(false);
                      } catch (error: any) {
                        // Don't show error toast if we're redirecting due to auth failure
                        const errorMessage = error?.message || String(error);
                        const isAuthError = error?.isAuthRedirect ||
                          errorMessage.includes('Invalid or expired token') ||
                          errorMessage.includes('Session expired') ||
                          error?.status === 401;

                        if (isAuthError) {
                          // Redirect is happening, don't show error or close dialog
                          // The redirect will take the user to login page
                          return;
                        }

                        toast({
                          title: 'Error',
                          description:
                            error instanceof Error
                              ? error.message
                              : 'Failed to delete all transactions. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Delete All
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-success">
                      ${getTotalIncome().toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-destructive">
                      ${getTotalExpenses().toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Net Balance</p>
                    <p className="text-2xl font-bold text-primary">
                      ${(getTotalIncome() - getTotalExpenses()).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTransactionsToPDF(transactions)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTransactionsToExcel(transactions)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className={`cursor-pointer hover:bg-muted ${sortConfig.key === 'type' ? 'font-bold' : ''}`}
                          onClick={() => handleSort('type')}
                        >
                          <div className="flex items-center">
                            Type{getSortIcon('type')}
                          </div>
                        </TableHead>
                        <TableHead
                          className={`cursor-pointer hover:bg-muted ${sortConfig.key === 'description' ? 'font-bold' : ''}`}
                          onClick={() => handleSort('description')}
                        >
                          <div className="flex items-center">
                            Description{getSortIcon('description')}
                          </div>
                        </TableHead>
                        <TableHead
                          className={`cursor-pointer hover:bg-muted ${sortConfig.key === 'category' ? 'font-bold' : ''}`}
                          onClick={() => handleSort('category')}
                        >
                          <div className="flex items-center">
                            Category{getSortIcon('category')}
                          </div>
                        </TableHead>
                        <TableHead
                          className={`cursor-pointer hover:bg-muted ${sortConfig.key === 'date' ? 'font-bold' : ''}`}
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center">
                            Date{getSortIcon('date')}
                          </div>
                        </TableHead>
                        <TableHead
                          className={`cursor-pointer hover:bg-muted text-right ${sortConfig.key === 'amount' ? 'font-bold' : ''}`}
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center justify-end">
                            Amount{getSortIcon('amount')}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${transaction.type === 'income'
                                  ? 'bg-success'
                                  : 'bg-destructive'
                                  }`}
                              />
                              <span className="capitalize">{transaction.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(transaction.date), 'EEE, MMM. dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`text-lg font-bold ${transaction.type === 'income'
                                ? 'text-success'
                                : 'text-destructive'
                                }`}
                            >
                              {transaction.type === 'income' ? '+' : '-'}$
                              {transaction.amount.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(transaction.id)}
                                disabled={
                                  transaction.source !== 'transaction' &&
                                  !!transaction.source
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(transaction.id)}
                                disabled={
                                  transaction.source !== 'transaction' &&
                                  !!transaction.source
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recurring">
            <RecurringTransactionsList />
          </TabsContent>
        </Tabs>

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
              Audit History & Activity Logs
            </Button>
          </div>
        </footer>
      </div>

      <HistorySheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entityType="transaction"
        title="Transaction Logs"
      />
    </>
  );
}
