import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance } from '@/contexts/FinanceContext';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    LineChart,
    Line,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChartIcon, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Reports() {
    const { transactions } = useFinance();
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Get available months from transactions
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        transactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
        });
        return Array.from(months).sort().reverse();
    }, [transactions]);

    // Filter transactions by selected month
    const monthTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthKey === selectedMonth;
        });
    }, [transactions, selectedMonth]);

    // Calculate totals
    const totals = useMemo(() => {
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;
        const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : '0';

        return { income, expenses, balance, savingsRate };
    }, [monthTransactions]);

    // Category breakdown
    const categoryData = useMemo(() => {
        const categories = new Map<string, { income: number; expense: number }>();

        monthTransactions.forEach(t => {
            const current = categories.get(t.category) || { income: 0, expense: 0 };
            if (t.type === 'income') {
                current.income += t.amount;
            } else {
                current.expense += t.amount;
            }
            categories.set(t.category, current);
        });

        return Array.from(categories.entries()).map(([name, data]) => ({
            name,
            income: data.income,
            expense: data.expense,
            total: data.income + data.expense,
        })).sort((a, b) => b.total - a.total);
    }, [monthTransactions]);

    // Expense pie chart data
    const expensePieData = useMemo(() => {
        const expenses = new Map<string, number>();
        monthTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expenses.set(t.category, (expenses.get(t.category) || 0) + t.amount);
            });

        return Array.from(expenses.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [monthTransactions]);

    // Income pie chart data
    const incomePieData = useMemo(() => {
        const incomes = new Map<string, number>();
        monthTransactions
            .filter(t => t.type === 'income')
            .forEach(t => {
                incomes.set(t.category, (incomes.get(t.category) || 0) + t.amount);
            });

        return Array.from(incomes.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [monthTransactions]);

    // Daily trend data
    const dailyTrendData = useMemo(() => {
        const dailyData = new Map<string, { income: number; expense: number }>();

        monthTransactions.forEach(t => {
            const day = format(new Date(t.date), 'MMM dd');
            const current = dailyData.get(day) || { income: 0, expense: 0 };
            if (t.type === 'income') {
                current.income += t.amount;
            } else {
                current.expense += t.amount;
            }
            dailyData.set(day, current);
        });

        return Array.from(dailyData.entries())
            .map(([date, data]) => ({
                date,
                income: data.income,
                expense: data.expense,
                net: data.income - data.expense,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [monthTransactions]);

    // Top expenses
    const topExpenses = useMemo(() => {
        return monthTransactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [monthTransactions]);

    // Top incomes
    const topIncomes = useMemo(() => {
        return monthTransactions
            .filter(t => t.type === 'income')
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [monthTransactions]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const formatMonthLabel = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return format(date, 'MMMM yyyy');
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Financial Reports</h1>
                    <p className="text-muted-foreground">Comprehensive analysis of your finances</p>
                </div>
                <div className="w-64">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMonths.map(month => (
                                <SelectItem key={month} value={month}>
                                    {formatMonthLabel(month)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(totals.income)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {monthTransactions.filter(t => t.type === 'income').length} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                            {formatCurrency(totals.expenses)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {monthTransactions.filter(t => t.type === 'expense').length} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br ${totals.balance >= 0 ? 'from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-blue-200' : 'from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900 border-orange-200'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                        <DollarSign className={`h-4 w-4 ${totals.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
                            {formatCurrency(totals.balance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totals.balance >= 0 ? 'Surplus' : 'Deficit'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            {totals.savingsRate}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Of total income
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income vs Expenses Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Income vs Expenses by Category
                        </CardTitle>
                        <CardDescription>Compare income and expenses across categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend />
                                <Bar dataKey="income" fill="#10b981" name="Income" />
                                <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Daily Trend Line Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Daily Cash Flow Trend
                        </CardTitle>
                        <CardDescription>Track your daily income and expenses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dailyTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend />
                                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net" strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 - Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5" />
                            Expense Breakdown
                        </CardTitle>
                        <CardDescription>Distribution of expenses by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={expensePieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {expensePieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Income Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5" />
                            Income Breakdown
                        </CardTitle>
                        <CardDescription>Distribution of income by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={incomePieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {incomePieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top Transactions Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Expenses */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Expenses</CardTitle>
                        <CardDescription>Largest expenses this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topExpenses.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No expenses this month</p>
                            ) : (
                                topExpenses.map((transaction, index) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{transaction.description}</p>
                                                <p className="text-sm text-muted-foreground">{transaction.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-600">{formatCurrency(transaction.amount)}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), 'MMM dd')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Incomes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Incomes</CardTitle>
                        <CardDescription>Largest incomes this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topIncomes.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No income this month</p>
                            ) : (
                                topIncomes.map((transaction, index) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{transaction.description}</p>
                                                <p className="text-sm text-muted-foreground">{transaction.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">{formatCurrency(transaction.amount)}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), 'MMM dd')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Details Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Category Summary</CardTitle>
                    <CardDescription>Detailed breakdown by category</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 font-semibold">Category</th>
                                    <th className="text-right p-3 font-semibold text-green-600">Income</th>
                                    <th className="text-right p-3 font-semibold text-red-600">Expenses</th>
                                    <th className="text-right p-3 font-semibold">Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryData.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No transactions this month
                                        </td>
                                    </tr>
                                ) : (
                                    categoryData.map((cat) => {
                                        const net = cat.income - cat.expense;
                                        return (
                                            <tr key={cat.name} className="border-b hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-medium">{cat.name}</td>
                                                <td className="p-3 text-right text-green-600">
                                                    {cat.income > 0 ? formatCurrency(cat.income) : '-'}
                                                </td>
                                                <td className="p-3 text-right text-red-600">
                                                    {cat.expense > 0 ? formatCurrency(cat.expense) : '-'}
                                                </td>
                                                <td className={`p-3 text-right font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(net)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            {categoryData.length > 0 && (
                                <tfoot>
                                    <tr className="font-bold bg-muted">
                                        <td className="p-3">Total</td>
                                        <td className="p-3 text-right text-green-600">{formatCurrency(totals.income)}</td>
                                        <td className="p-3 text-right text-red-600">{formatCurrency(totals.expenses)}</td>
                                        <td className={`p-3 text-right ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(totals.balance)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
