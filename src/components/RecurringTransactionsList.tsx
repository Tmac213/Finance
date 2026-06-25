import React, { useState } from 'react';
import { useFinance, RecurringTransaction } from '../contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Calendar, RefreshCw, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RecurringTransactionsList() {
    const { recurringTransactions, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } = useFinance();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Recurring Transactions</h2>
                    <p className="text-muted-foreground">Manage your automated recurring income and expenses.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Recurring
                </Button>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <RecurringForm
                        onSubmit={async (data) => {
                            await addRecurringTransaction(data);
                            setIsAddOpen(false);
                        }}
                        onCancel={() => setIsAddOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
                <DialogContent>
                    {editingId && (
                        <RecurringForm
                            initialData={recurringTransactions.find(t => t.id === editingId)}
                            onSubmit={async (data) => {
                                await updateRecurringTransaction(editingId, data);
                                setEditingId(null);
                            }}
                            onCancel={() => setEditingId(null)}
                            isEditing
                        />
                    )}
                </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recurringTransactions.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-accent/10 rounded-lg border border-dashed">
                        <RefreshCw className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>No recurring transactions set up yet.</p>
                    </div>
                )}

                {recurringTransactions.map(t => (
                    <Card key={t.id} className={cn("relative overflow-hidden transition-all", !t.active && "opacity-60 grayscale")}>
                        <div className={cn("absolute top-0 left-0 w-1 h-full", t.type === 'income' ? "bg-emerald-500" : "bg-red-500")} />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{t.description}</CardTitle>
                                    <CardDescription className="capitalize">{t.frequency} {t.category}</CardDescription>
                                </div>
                                <Badge variant={t.type === 'income' ? 'default' : 'destructive'} className={cn(t.type === 'income' && "bg-emerald-500 hover:bg-emerald-600")}>
                                    {t.type}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-4">
                                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                            </div>

                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Next Due: <span className="text-foreground font-medium">{format(new Date(t.nextDueDate), 'PPP')}</span></span>
                                </div>
                                {t.lastGeneratedDate && (
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4" />
                                        <span>Last Run: {format(new Date(t.lastGeneratedDate), 'MMM d, yyyy')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                <Button variant="ghost" size="sm" onClick={() => updateRecurringTransaction(t.id, { active: !t.active })} title={t.active ? "Disable" : "Enable"}>
                                    <Power className={cn("h-4 w-4", t.active ? "text-green-500" : "text-muted-foreground")} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setEditingId(t.id)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                                    if (confirm('Are you sure you want to delete this recurring transaction rule?')) {
                                        deleteRecurringTransaction(t.id);
                                    }
                                }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function RecurringForm({ initialData, onSubmit, onCancel, isEditing }: {
    initialData?: any,
    onSubmit: (data: any) => void,
    onCancel: () => void,
    isEditing?: boolean
}) {
    const [formData, setFormData] = useState({
        description: initialData?.description || '',
        amount: initialData?.amount || '',
        type: initialData?.type || 'expense',
        category: initialData?.category || 'General',
        frequency: initialData?.frequency || 'monthly',
        startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
        nextDueDate: initialData?.nextDueDate || new Date().toISOString().split('T')[0],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            amount: Number(formData.amount),
            active: initialData?.active ?? true
        });
    };

    return (
        <div className="grid gap-4 py-4">
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit' : 'Add'} Recurring Transaction</DialogTitle>
                <DialogDescription>
                    {isEditing ? 'Update the details of this recurring rule.' : 'Set up a new automated transaction rule.'}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                        placeholder="e.g. Netflix Subscription"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Input
                            placeholder="e.g. Utilities"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Only show start date on creation, or allow editing next due date */}
                    <div className="space-y-2">
                        <Label>{isEditing ? 'Next Due Date' : 'Start Date'}</Label>
                        <Input
                            type="date"
                            value={isEditing ? formData.nextDueDate : formData.startDate}
                            onChange={e => {
                                const d = e.target.value;
                                setFormData(prev => isEditing ? ({ ...prev, nextDueDate: d }) : ({ ...prev, startDate: d, nextDueDate: d }));
                            }}
                            required
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Rule</Button>
                </DialogFooter>
            </form>
        </div>
    );
}
