import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFinance, FixedDue } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, CheckCircle, XCircle, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Trash } from 'lucide-react';
import { ExcelImportButton } from '@/components/ExcelImportButton';
import { generateFixedDuesTemplate } from '@/lib/templateUtils';
import { History as HistoryIcon } from 'lucide-react';
import { HistorySheet } from '@/components/HistorySheet';

export default function FixedDues() {
  const { fixedDues, addFixedDue, updateFixedDue, deleteFixedDue, deleteAllFixedDues, addTransaction, transactions, deleteTransaction, updateTransaction, syncData } = useFinance();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDue, setEditingDue] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    recurrence: 'monthly',
    startDate: '',
    endDate: '',
  });
  const [isDeleteByNameDialogOpen, setIsDeleteByNameDialogOpen] = useState(false);
  const [selectedNameToDelete, setSelectedNameToDelete] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Sync when page is mounted or becomes visible (for mobile)
  // Use a ref to track if we've already synced on mount to avoid duplicate calls
  useEffect(() => {
    let hasSyncedOnMount = false;
    let syncTimeout: NodeJS.Timeout | null = null;

    const syncOnVisible = async () => {
      if (!document.hidden && navigator.onLine) {
        console.log('[FixedDues] Page visible, triggering sync...');
        try {
          await syncData();
        } catch (error) {
          console.error('[FixedDues] Error syncing on visible:', error);
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

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      recurrence: 'monthly',
      startDate: '',
      endDate: '',
    });
    setEditingDue(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dueData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        recurrence: formData.recurrence as FixedDue['recurrence'],
        startDate: formData.startDate,
        endDate: formData.endDate,
        isPaid: false,
      };

      if (editingDue) {
        await updateFixedDue(editingDue.id, dueData);
        toast({
          title: 'Success',
          description: 'Fixed due updated successfully',
        });
      } else {
        await addFixedDue(dueData);
        toast({
          title: 'Success',
          description: 'Fixed due added successfully',
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save fixed due',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (due) => {
    setEditingDue(due);
    setFormData({
      name: due.name,
      amount: due.amount.toString(),
      recurrence: due.recurrence,
      startDate: due.startDate,
      endDate: due.endDate,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this fixed due?')) {
      try {
        await deleteFixedDue(id);
        toast({
          title: 'Success',
          description: 'Fixed due deleted successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete fixed due',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteAll = async () => {
    if (confirm('Are you sure you want to delete all fixed dues? This action cannot be undone.')) {
      try {
        await deleteAllFixedDues();
        toast({
          title: 'Success',
          description: 'All fixed dues deleted successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete all fixed dues',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteByName = async () => {
    if (!selectedNameToDelete) {
      toast({
        title: 'Error',
        description: 'Please select a name to delete',
        variant: 'destructive',
      });
      return;
    }

    const duesToDelete = fixedDues.filter(due => due.name === selectedNameToDelete);

    if (duesToDelete.length === 0) {
      toast({
        title: 'Error',
        description: 'No entries found with that name',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete ${duesToDelete.length} entries with the name "${selectedNameToDelete}"? This action cannot be undone.`)) {
      try {
        await Promise.all(duesToDelete.map(due => deleteFixedDue(due.id)));
        toast({
          title: 'Success',
          description: `Deleted ${duesToDelete.length} entries with name "${selectedNameToDelete}"`,
        });
        setIsDeleteByNameDialogOpen(false);
        setSelectedNameToDelete('');
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete entries',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[FixedDues] Refresh button clicked');
    try {
      console.log('[FixedDues] Calling syncData(force=true)...');
      await syncData(true);
      console.log('[FixedDues] syncData() completed successfully');
      toast({
        title: 'Success',
        description: 'Data refreshed from server',
      });
    } catch (error) {
      console.error('[FixedDues] Refresh error:', error);
      console.error('[FixedDues] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : typeof error,
      });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to refresh data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Force sync on page visibility change to ensure data is up to date
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        // Clear any pending sync
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }
        // Debounced visibility sync
        visibilityTimeout = setTimeout(() => {
          console.log('[FixedDues] Page became visible, forcing sync...');
          syncData(true).catch(error => {
            console.error('[FixedDues] Visibility sync failed:', error);
          });
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncData]);

  // Enhanced togglePaidStatus function with robust async handling, error checking, toggle lock, and button disable state
  const [toggleProcessingIds, setToggleProcessingIds] = useState(new Set());
  const [editingPaymentDateId, setEditingPaymentDateId] = useState<string | null>(null);
  const [tempPaymentDate, setTempPaymentDate] = useState<string>('');
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleBulkImport = async (data: any[]) => {
    const importPromises = data.map((row) =>
      addFixedDue({
        name: row.name,
        amount: row.amount,
        recurrence: row.recurrence,
        startDate: row.startDate,
        endDate: row.endDate,
        isPaid: false,
      })
    );

    await Promise.all(importPromises);
  };

  const togglePaidStatus = async (due) => {
    const dueId = due.id;

    if (toggleProcessingIds.has(dueId)) {
      console.log(`[togglePaidStatus] Toggle already in progress for ${dueId}, skipping...`);
      return;
    }

    setToggleProcessingIds((prev) => new Set(prev).add(dueId));

    try {
      // Get the latest state from fixedDues array to avoid stale data
      const latestDue = fixedDues.find(d => d.id === dueId) || due;

      // Convert current isPaid robustly to boolean
      const currentIsPaid = Boolean(latestDue.isPaid);

      // New toggled state
      const newIsPaid = !currentIsPaid;
      const newPaidDate = newIsPaid ? new Date().toISOString().split('T')[0] : null;

      console.log(`[togglePaidStatus] Toggling ${dueId}: current=${currentIsPaid}, new=${newIsPaid}`);

      // Auto-sync in FinanceContext will handle transaction creation/deletion
      await updateFixedDue(latestDue.id, {
        isPaid: newIsPaid,
        paidDate: newPaidDate,
      });

      toast({
        title: 'Success',
        description: `Fixed due marked as ${newIsPaid ? 'paid' : 'unpaid'}`,
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setToggleProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(dueId);
        return newSet;
      });
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const sortedDues = useMemo(() => {
    let sortableDues = [...fixedDues];
    if (sortConfig.key) {
      sortableDues.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'amount':
            aValue = a.amount;
            bValue = b.amount;
            break;
          case 'recurrence':
            aValue = a.recurrence;
            bValue = b.recurrence;
            break;
          case 'dueDate':
            aValue = new Date(a.dueDate).getTime();
            bValue = new Date(b.dueDate).getTime();
            break;
          case 'paidDate':
            aValue = a.paidDate ? new Date(a.paidDate).getTime() : Infinity;
            bValue = b.paidDate ? new Date(b.paidDate).getTime() : Infinity;
            break;
          case 'status':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const aDueDate = new Date(a.dueDate);
            aDueDate.setHours(0, 0, 0, 0);
            const aDaysDiff = Math.floor((aDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const bDueDate = new Date(b.dueDate);
            bDueDate.setHours(0, 0, 0, 0);
            const bDaysDiff = Math.floor((bDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            aValue = a.isPaid ? -Infinity : aDaysDiff;
            bValue = b.isPaid ? -Infinity : bDaysDiff;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableDues;
  }, [fixedDues, sortConfig]);

  const uniqueNames = useMemo(() => {
    const names = new Set(fixedDues.map(due => due.name));
    return Array.from(names).sort();
  }, [fixedDues]);

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Fixed Dues</h1>
            <p className="text-muted-foreground">Manage your recurring payments and obligations</p>
          </div>
          <div className="flex space-x-2 items-center">
            <ExcelImportButton
              expectedColumns={['name', 'amount', 'recurrence', 'startDate', 'endDate']}
              parseRow={(row: any) => {
                const name = String(row['Name'] || row['name'] || '').trim();
                const amount = typeof row['Amount'] === 'number'
                  ? row['Amount']
                  : parseFloat(String(row['Amount'] || row['amount'] || '0').replace(/[^0-9.-]/g, ''));
                const recurrence = String(row['Recurrence'] || row['recurrence'] || 'monthly').toLowerCase().trim();
                const startDate = row['Start Date'] || row['startDate'] || row['Start_Date'] || '';
                const endDate = row['End Date'] || row['endDate'] || row['End_Date'] || '';

                // Parse dates
                let parsedStartDate = '';
                let parsedEndDate = '';

                if (startDate) {
                  const startDateObj = new Date(startDate);
                  if (!isNaN(startDateObj.getTime())) {
                    parsedStartDate = startDateObj.toISOString().split('T')[0];
                  }
                }

                if (endDate) {
                  const endDateObj = new Date(endDate);
                  if (!isNaN(endDateObj.getTime())) {
                    parsedEndDate = endDateObj.toISOString().split('T')[0];
                  }
                }

                return {
                  name,
                  amount: isNaN(amount) ? 0 : amount,
                  recurrence,
                  startDate: parsedStartDate,
                  endDate: parsedEndDate,
                };
              }}
              validateRow={(row: any) => {
                const errors: string[] = [];
                const validRecurrences = ['daily', 'weekly', 'monthly', 'quarterly', 'semi-annually', 'annually'];

                if (!row.name) errors.push('Name is required');
                if (row.amount <= 0) errors.push('Amount must be greater than 0');
                if (!validRecurrences.includes(row.recurrence)) {
                  errors.push('Recurrence must be one of: daily, weekly, monthly, quarterly, semi-annually, annually');
                }
                if (!row.startDate) errors.push('Start date is required');
                if (!row.endDate) errors.push('End date is required');

                return { valid: errors.length === 0, errors };
              }}
              onImport={handleBulkImport}
              templateDownloadFn={generateFixedDuesTemplate}
            />
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {fixedDues.length > 0 && (
              <>
                <Dialog open={isDeleteByNameDialogOpen} onOpenChange={setIsDeleteByNameDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete by Name
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete by Name</DialogTitle>
                      <DialogDescription>
                        Select a name to delete all entries with that name
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nameToDelete">Select Name</Label>
                        <Select value={selectedNameToDelete} onValueChange={setSelectedNameToDelete}>
                          <SelectTrigger id="nameToDelete">
                            <SelectValue placeholder="Choose a name..." />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueNames.map((name) => {
                              const count = fixedDues.filter(due => due.name === name).length;
                              return (
                                <SelectItem key={name} value={name}>
                                  {name} ({count} {count === 1 ? 'entry' : 'entries'})
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => {
                          setIsDeleteByNameDialogOpen(false);
                          setSelectedNameToDelete('');
                        }}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDeleteByName}
                          disabled={!selectedNameToDelete}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" onClick={handleDeleteAll}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All
                </Button>
              </>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fixed Due
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDue ? 'Edit Fixed Due' : 'Add Fixed Due'}</DialogTitle>
                  <DialogDescription>
                    {editingDue ? 'Update the details of your fixed due.' : 'Create a new recurring payment obligation.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurrence">Recurrence</Label>
                    <Select value={formData.recurrence} onValueChange={(value) => setFormData({ ...formData, recurrence: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingDue ? 'Update' : 'Add'} Fixed Due
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Fixed Dues</CardTitle>
            <CardDescription>A list of all your recurring payment obligations</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {fixedDues.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No fixed dues found. Add your first recurring payment above.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className={`cursor-pointer hover:bg-muted font-medium min-w-[150px] px-4 ${sortConfig.key === 'name' ? 'font-bold' : ''}`}
                        onClick={() => handleSort('name')}
                      >
                        Name{getSortIcon('name')}
                      </TableHead>
                      <TableHead
                        className={`cursor-pointer hover:bg-muted font-medium min-w-[100px] px-4 ${sortConfig.key === 'amount' ? 'font-bold' : ''}`}
                        onClick={() => handleSort('amount')}
                      >
                        Amount{getSortIcon('amount')}
                      </TableHead>
                      <TableHead
                        className={`cursor-pointer hover:bg-muted font-medium min-w-[100px] px-4 ${sortConfig.key === 'recurrence' ? 'font-bold' : ''}`}
                        onClick={() => handleSort('recurrence')}
                      >
                        Recurrence{getSortIcon('recurrence')}
                      </TableHead>
                      <TableHead
                        className={`cursor-pointer hover:bg-muted font-medium min-w-[120px] px-4 ${sortConfig.key === 'dueDate' ? 'font-bold' : ''}`}
                        onClick={() => handleSort('dueDate')}
                      >
                        Due Date{getSortIcon('dueDate')}
                      </TableHead>
                      <TableHead
                        className={`cursor-pointer hover:bg-muted font-medium min-w-[120px] px-4 ${sortConfig.key === 'paidDate' ? 'font-bold' : ''}`}
                        onClick={() => handleSort('paidDate')}
                      >
                        Payment Date{getSortIcon('paidDate')}
                      </TableHead>
                      <TableHead
                        className={`cursor-pointer hover:bg-muted font-medium min-w-[150px] px-4 ${sortConfig.key === 'status' ? 'font-bold' : ''}`}
                        onClick={() => handleSort('status')}
                      >
                        Status{getSortIcon('status')}
                      </TableHead>
                      <TableHead className="min-w-[120px] px-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDues.map((due) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dueDate = new Date(due.dueDate);
                      dueDate.setHours(0, 0, 0, 0);
                      const isOverdue = dueDate < today && !due.isPaid;
                      const currentMonth = today.getMonth();
                      const currentYear = today.getFullYear();
                      const dueMonth = dueDate.getMonth();
                      const dueYear = dueDate.getFullYear();
                      const isNextMonth = (dueYear === currentYear && dueMonth === currentMonth + 1) || (dueYear === currentYear + 1 && dueMonth === 0 && currentMonth === 11);
                      const isThisMonth = dueYear === currentYear && dueMonth === currentMonth;
                      let rowClass = 'py-3'; // Increased vertical padding for better row height

                      if (due.isPaid) {
                        rowClass += ' bg-green-50 border-green-200';
                      } else if (isOverdue) {
                        rowClass += ' bg-red-50 border-red-200';
                      } else if (isNextMonth) {
                        rowClass += ' bg-yellow-50 border-yellow-200';
                      } else if (isThisMonth) {
                        rowClass += ' bg-orange-50 border-orange-200';
                      } else {
                        rowClass += ' bg-blue-50 border-blue-200';
                      }

                      return (
                        <TableRow key={due.id} className={rowClass}>
                          <TableCell className="font-medium px-4">{due.name}</TableCell>
                          <TableCell className="px-4">
                            {editingAmountId === due.id ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={tempAmount}
                                onChange={(e) => setTempAmount(e.target.value)}
                                onBlur={async () => {
                                  try {
                                    const newAmount = parseFloat(tempAmount);
                                    if (isNaN(newAmount) || newAmount < 0) {
                                      throw new Error('Amount must be a positive number');
                                    }
                                    await updateFixedDue(due.id, { amount: newAmount });
                                    setEditingAmountId(null);
                                    setTempAmount('');
                                  } catch (error) {
                                    toast({
                                      title: 'Error',
                                      description: error.message || 'Failed to update amount',
                                      variant: 'destructive',
                                    });
                                    setEditingAmountId(null);
                                    setTempAmount(due.amount.toString());
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  } else if (e.key === 'Escape') {
                                    setEditingAmountId(null);
                                    setTempAmount('');
                                  }
                                }}
                                autoFocus
                                className="w-24"
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                                onClick={() => {
                                  setEditingAmountId(due.id);
                                  setTempAmount(due.amount.toString());
                                }}
                              >
                                ${due.amount.toFixed(2)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="capitalize px-4">{due.recurrence}</TableCell>
                          <TableCell className="px-4">{formatDate(due.dueDate)}</TableCell>
                          <TableCell className="px-4">
                            {editingPaymentDateId === due.id ? (
                              <Input
                                type="date"
                                value={tempPaymentDate}
                                onChange={(e) => setTempPaymentDate(e.target.value)}
                                onBlur={async () => {
                                  try {
                                    await updateFixedDue(due.id, { paidDate: tempPaymentDate || null });
                                    if (due.isPaid && tempPaymentDate) {
                                      const relatedTransaction = transactions.find(t => t.source === 'fixed-due' && t.source_id === due.id);
                                      if (relatedTransaction) {
                                        await updateTransaction(relatedTransaction.id, { date: tempPaymentDate });
                                      }
                                    }
                                    setEditingPaymentDateId(null);
                                    setTempPaymentDate('');
                                  } catch (error) {
                                    toast({
                                      title: 'Error',
                                      description: error.message || 'Failed to update payment date',
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  } else if (e.key === 'Escape') {
                                    setEditingPaymentDateId(null);
                                    setTempPaymentDate('');
                                  }
                                }}
                                autoFocus
                                className="w-32"
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                                onClick={() => {
                                  setEditingPaymentDateId(due.id);
                                  setTempPaymentDate(due.paidDate || '');
                                }}
                              >
                                {formatDate(due.paidDate)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4">
                            {(() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const dueDateObj = new Date(due.dueDate);
                              dueDateObj.setHours(0, 0, 0, 0);
                              const daysDiff = Math.floor((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                              if (due.isPaid) {
                                const paidDateObj = due.paidDate ? new Date(due.paidDate) : dueDateObj;
                                const paidDaysDiff = Math.floor((paidDateObj.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));
                                const statusText = paidDaysDiff <= 0 ? 'Paid on time ✓' : `Paid ${paidDaysDiff} days late`;
                                return (
                                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                    {statusText}
                                  </Badge>
                                );
                              } else {
                                let statusText = '';
                                let variant: "default" | "secondary" | "destructive" | "outline" = 'secondary';
                                let className = 'bg-gray-100 text-gray-800 border-gray-200';

                                if (daysDiff < 0) {
                                  // Overdue
                                  statusText = `Overdue by ${Math.abs(daysDiff)} days`;
                                  variant = 'destructive';
                                  className = 'bg-red-100 text-red-800 border-red-200';
                                } else if (daysDiff === 0) {
                                  statusText = 'Due today!';
                                  variant = 'default';
                                  className = 'bg-orange-100 text-orange-800 border-orange-200';
                                } else if (daysDiff <= 7) {
                                  statusText = `Due in ${daysDiff} days`;
                                  variant = 'default';
                                  className = 'bg-orange-100 text-orange-800 border-orange-200';
                                } else if (daysDiff <= 30) {
                                  statusText = `Due in ${daysDiff} days`;
                                  variant = 'secondary';
                                  className = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                                } else {
                                  statusText = `Due in ${daysDiff} days`;
                                  variant = 'outline';
                                  className = 'bg-blue-100 text-blue-800 border-blue-200';
                                }

                                return (
                                  <Badge variant={variant} className={className}>
                                    {statusText}
                                  </Badge>
                                );
                              }
                            })()}
                          </TableCell>
                          <TableCell className="px-4">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => togglePaidStatus(due)}
                                disabled={toggleProcessingIds.has(due.id)}
                              >
                                {due.isPaid ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(due)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(due.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
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
              Audit History & Activity Logs
            </Button>
          </div>
        </footer>
      </div>

      <HistorySheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entityType="fixed-due"
        title="Fixed Dues History"
      />
    </>
  );
}
