import { StatCard } from '@/components/StatCard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  Wallet,
  PiggyBank,
  Coins,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    transactions,
    fixedDues,
    vibesSalary,
    moneyHoldings,
    bullionHoldings,
    bullionPrices,
    getTotalBalance,
    getTotalIncome,
    getTotalExpenses,
  } = useFinance();

  // Current month data
  const currentMonthData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;
    const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : '0';

    return { income, expenses, balance, savingsRate, transactions: monthTransactions };
  }, [transactions]);

  // Total balances (all-time)
  const totalBalance = getTotalBalance();
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Upcoming dues
  const upcomingDues = useMemo(() => {
    const today = new Date();
    return fixedDues
      .filter((due) => !due.isPaid)
      .map((due) => {
        const dueDate = new Date(due.dueDate);
        const daysLeft = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return { ...due, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);
  }, [fixedDues]);

  // Overdue count
  const overdueDues = useMemo(() => {
    const today = new Date();
    return fixedDues.filter(due => {
      const dueDate = new Date(due.dueDate);
      return !due.isPaid && dueDate < today;
    }).length;
  }, [fixedDues]);

  // Vibes Salary summary - Use same logic as Vibes Salary page
  const vibesSalarySummary = useMemo(() => {
    if (!vibesSalary) return { total: 0, remaining: 0, spent: 0, recentMonths: [] };

    const total = vibesSalary.expectedAmount || 0;
    const payments = vibesSalary.payments || [];
    const monthlyExpected = vibesSalary.monthlyExpectedAmounts || {};
    const spent = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = total - spent;

    // Helper function to get expected amount for a month (same as Vibes Salary page)
    const getExpectedForMonth = (monthKey: string) => {
      return monthlyExpected[monthKey] || total;
    };

    // Generate month range from May 2023 to 2 years in future
    const generateMonthRange = () => {
      const months = [];
      const startDate = new Date('2023-05-01');
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const current = new Date(startDate);
      while (current <= futureDate) {
        months.push(format(current, 'yyyy-MM'));
        current.setMonth(current.getMonth() + 1);
      }
      return months;
    };

    // Allocate payments FIFO (same logic as Vibes Salary page)
    const months = generateMonthRange();
    const allocation: Record<string, { allocated: number }> = {};

    months.forEach((month) => {
      allocation[month] = { allocated: 0 };
    });

    const sortedPayments = [...payments]
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
          remainingAmount -= allocateAmount;
        }
      }

      if (remainingAmount > 0) {
        const paymentMonth = format(new Date(payment.date), 'yyyy-MM');
        if (allocation[paymentMonth]) {
          allocation[paymentMonth].allocated += remainingAmount;
        }
      }
    });

    // Get last 5 months (current and previous 4)
    const now = new Date();
    const recentMonthKeys = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      recentMonthKeys.push(format(date, 'yyyy-MM'));
    }

    // Calculate status for recent months
    const recentMonths = recentMonthKeys.map(monthKey => {
      const expected = getExpectedForMonth(monthKey);
      const paid = allocation[monthKey]?.allocated || 0;
      const unpaid = Math.max(0, expected - paid);

      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';

      if (expected > 0 && paid >= expected) {
        status = 'paid';
      } else if (paid > 0 && expected > 0 && paid < expected) {
        status = 'partial';
      } else if (expected > 0 && paid === 0) {
        status = 'unpaid';
      }

      return {
        month: monthKey,
        expected,
        paid,
        unpaid,
        status,
      };
    });

    // Calculate total unpaid for current and past months
    const currentMonth = format(new Date(), 'yyyy-MM');
    const totalUnpaid = recentMonths
      .filter(m => m.month <= currentMonth)
      .reduce((sum, m) => sum + m.unpaid, 0);

    return {
      total,
      spent,
      remaining,
      totalUnpaid,
      recentMonths,
    };
  }, [vibesSalary]);

  // Money Holdings summary
  const moneyHoldingsSummary = useMemo(() => {
    if (!moneyHoldings || !moneyHoldings.holdings) {
      return { totalValue: 0, count: 0, currencies: 0, currencyList: [] };
    }

    const { holdings, activeCurrencies, currencyData, billCounts } = moneyHoldings;

    // Calculate total value in USD from billCounts
    const totalValue = activeCurrencies.reduce((sum, code) => {
      const currency = currencyData?.find(c => c.code === code);
      const denominations = currency?.denominations || [];
      const codeLower = code.toLowerCase();

      // Calculate amount in this currency
      const amount = denominations.reduce((currencySum, denom) => {
        const count = billCounts?.[codeLower]?.[denom] || 0;
        return currencySum + count * denom;
      }, 0);

      // Convert to USD
      const exchangeRate = currency?.exchangeRateToUsd || 1;
      return sum + (amount * exchangeRate);
    }, 0);

    // Get currency details for display
    const currencyList = activeCurrencies.slice(0, 5).map(code => {
      const currency = currencyData?.find(c => c.code === code);

      // Calculate amount from billCounts (use lowercase for key)
      const denominations = currency?.denominations || [];
      const codeLower = code.toLowerCase();
      const amount = denominations.reduce((sum, denom) => {
        const count = billCounts?.[codeLower]?.[denom] || 0;
        return sum + count * denom;
      }, 0);

      // Get bill breakdown (e.g., "3×$100, 1×$2, 4×$1")
      const billBreakdown = denominations
        .filter(denom => (billCounts?.[codeLower]?.[denom] || 0) > 0)
        .sort((a, b) => b - a) // Largest first
        .map(denom => {
          const count = billCounts?.[codeLower]?.[denom];
          return `${count}×${denom.toLocaleString()}`;
        })
        .join(', ');

      return {
        code,
        name: currency?.name || code,
        symbol: currency?.symbol || '$',
        amount,
        exchangeRate: currency?.exchangeRateToUsd || 1,
        billBreakdown,
      };
    });

    return {
      totalValue,
      count: activeCurrencies.length,
      currencies: activeCurrencies.length,
      currencyList,
    };
  }, [moneyHoldings]);

  // Bullion Holdings summary
  const bullionHoldingsSummary = useMemo(() => {
    if (!Array.isArray(bullionHoldings)) {
      return { totalValue: 0, totalWeight: 0, count: 0, holdings: [] };
    }

    // Filter out empty holdings (where weight is 0)
    const activeHoldings = bullionHoldings.filter(h => (h.pureOunces || 0) > 0);

    // Live prices from context
    const prices = bullionPrices;

    const totalValue = activeHoldings.reduce((sum, holding) => {
      const price = prices[holding.type.toLowerCase()] || 0;
      return sum + (holding.pureOunces || 0) * price;
    }, 0);

    const totalWeight = activeHoldings.reduce((sum, h) => sum + (h.pureOunces || 0), 0);

    const holdingsWithValue = activeHoldings.map(h => ({
      ...h,
      calculatedValue: (h.pureOunces || 0) * (prices[h.type.toLowerCase()] || 0)
    }));

    return {
      totalValue,
      totalWeight,
      count: activeHoldings.length,
      holdings: holdingsWithValue.slice(0, 5),
    };
  }, [bullionHoldings, bullionPrices]);

  // Expense breakdown for pie chart
  const expenseBreakdown = useMemo(() => {
    const categories = new Map<string, number>();
    currentMonthData.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categories.set(t.category, (categories.get(t.category) || 0) + t.amount);
      });

    return Array.from(categories.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [currentMonthData]);

  // Category comparison for bar chart
  const categoryComparison = useMemo(() => {
    const categories = new Map<string, { income: number; expense: number }>();

    currentMonthData.transactions.forEach(t => {
      const current = categories.get(t.category) || { income: 0, expense: 0 };
      if (t.type === 'income') {
        current.income += t.amount;
      } else {
        current.expense += t.amount;
      }
      categories.set(t.category, current);
    });

    return Array.from(categories.entries())
      .map(([name, data]) => ({
        name,
        income: data.income,
        expense: data.expense,
      }))
      .sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
      .slice(0, 5);
  }, [currentMonthData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's your complete financial overview.
        </p>
      </div>

      {/* All-Time Totals */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            All-Time Totals
          </CardTitle>
          <CardDescription>Complete financial summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Total Income</p>
                  <p className="text-xs text-muted-foreground">All time</p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Total Expenses</p>
                  <p className="text-xs text-muted-foreground">All time</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${totalBalance >= 0
              ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200'
              : 'bg-orange-50 dark:bg-orange-950 border border-orange-200'
              }`}>
              <div className="flex items-center gap-3">
                <DollarSign className={`h-5 w-5 ${totalBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                <div>
                  <p className="text-sm font-medium">Total Balance</p>
                  <p className="text-xs text-muted-foreground">
                    {totalBalance >= 0 ? 'Net Surplus' : 'Net Deficit'}
                  </p>
                </div>
              </div>
              <span className={`text-lg font-bold ${totalBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(totalBalance)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Month Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(currentMonthData.income)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(currentMonthData.expenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${currentMonthData.balance >= 0 ? 'from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-blue-200' : 'from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900 border-orange-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month Balance</CardTitle>
            <DollarSign className={`h-4 w-4 ${currentMonthData.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonthData.balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
              {formatCurrency(currentMonthData.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonthData.balance >= 0 ? 'Surplus' : 'Deficit'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {currentMonthData.savingsRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Of monthly income
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Expense Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Top Expense Categories
            </CardTitle>
            <CardDescription>This month's spending breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No expense data this month
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Income vs Expenses
            </CardTitle>
            <CardDescription>Top categories this month</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No transaction data this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Lists - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${transaction.type === 'income'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                          }`}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')} • {transaction.category}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${transaction.type === 'income'
                        ? 'text-green-600'
                        : 'text-red-600'
                        }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions yet
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => navigate('/transactions')}
            >
              View All Transactions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Fixed Dues */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Fixed Dues</CardTitle>
            <CardDescription>Bills and payments due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDues.length > 0 ? (
                upcomingDues.map((due) => (
                  <div
                    key={due.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${due.daysLeft < 0
                      ? 'bg-red-50 dark:bg-red-950 border border-red-200'
                      : due.daysLeft <= 3
                        ? 'bg-orange-50 dark:bg-orange-950 border border-orange-200'
                        : 'hover:bg-muted/50'
                      } transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      {due.daysLeft < 0 ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : due.daysLeft <= 3 ? (
                        <Clock className="h-4 w-4 text-orange-600" />
                      ) : (
                        <Calendar className="h-4 w-4 text-blue-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{due.name}</p>
                        <p className={`text-xs ${due.daysLeft < 0
                          ? 'text-red-600 font-semibold'
                          : due.daysLeft <= 3
                            ? 'text-orange-600 font-semibold'
                            : 'text-muted-foreground'
                          }`}>
                          {due.daysLeft > 0
                            ? `${due.daysLeft} days left`
                            : due.daysLeft === 0
                              ? 'Due today'
                              : `${Math.abs(due.daysLeft)} days overdue`}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(due.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming dues
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => navigate('/fixed-dues')}
            >
              View All Fixed Dues
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detail Lists - Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Vibes Salary Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Vibes Salary
            </CardTitle>
            <CardDescription>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-orange-600">
                  Total Unpaid: {formatCurrency(vibesSalarySummary.totalUnpaid)}
                </p>
                <p className="text-xs">
                  Total outstanding for current and past months
                </p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vibesSalarySummary.recentMonths.length > 0 ? (
                vibesSalarySummary.recentMonths.map((item) => {
                  const [year, month] = item.month.split('-');
                  const monthName = format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy');

                  // Determine color and icon based on status
                  let bgColor = '';
                  let borderColor = '';
                  let icon = null;
                  let statusText = '';
                  let statusColor = '';

                  if (item.status === 'paid') {
                    bgColor = 'bg-green-50 dark:bg-green-950';
                    borderColor = 'border-green-200';
                    icon = <CheckCircle className="h-4 w-4 text-green-600" />;
                    statusText = 'Fully Paid';
                    statusColor = 'text-green-600';
                  } else if (item.status === 'partial') {
                    bgColor = 'bg-orange-50 dark:bg-orange-950';
                    borderColor = 'border-orange-200';
                    icon = <Clock className="h-4 w-4 text-orange-600" />;
                    statusText = `${formatCurrency(item.unpaid)} unpaid`;
                    statusColor = 'text-orange-600';
                  } else {
                    bgColor = 'bg-red-50 dark:bg-red-950';
                    borderColor = 'border-red-200';
                    icon = <AlertCircle className="h-4 w-4 text-red-600" />;
                    statusText = 'Not Paid';
                    statusColor = 'text-red-600';
                  }

                  return (
                    <div
                      key={item.month}
                      className={`flex items-center justify-between p-2 rounded-lg ${bgColor} border ${borderColor}`}
                    >
                      <div className="flex items-center gap-3">
                        {icon}
                        <div>
                          <p className="text-sm font-medium">{monthName}</p>
                          <p className={`text-xs font-semibold ${statusColor}`}>
                            {statusText}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(item.paid)}
                        </p>
                        {item.expected > 0 && (
                          <p className="text-xs text-muted-foreground">
                            of {formatCurrency(item.expected)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No salary data available
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => navigate('/vibes-salary')}
            >
              View Vibes Salary
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Money Holdings Details */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Money Holdings
            </CardTitle>
            <CardDescription>
              {formatCurrency(moneyHoldingsSummary.totalValue)} across {moneyHoldingsSummary.currencies} {moneyHoldingsSummary.currencies === 1 ? 'currency' : 'currencies'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {moneyHoldingsSummary.currencyList.length > 0 ? (
                moneyHoldingsSummary.currencyList.map((currency) => (
                  <div
                    key={currency.code}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <PiggyBank className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {currency.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {currency.amount.toLocaleString()} {currency.code}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(currency.amount * currency.exchangeRate)}
                        </p>
                        {currency.code !== 'USD' && (
                          <p className="text-xs text-gray-500">USD Value</p>
                        )}
                      </div>
                    </div>
                    {currency.billBreakdown && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-1">Bill Breakdown:</p>
                        <p className="text-sm text-gray-700">
                          {currency.billBreakdown}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No money holdings
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-6 hover:bg-green-50 hover:text-green-700"
              onClick={() => navigate('/money-tracking')}
            >
              View Money Tracking
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detail Lists - Row 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bullion Holdings Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Bullion Holdings
            </CardTitle>
            <CardDescription>
              {formatCurrency(bullionHoldingsSummary.totalValue)} • {bullionHoldingsSummary.totalWeight.toFixed(2)} oz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bullionHoldingsSummary.holdings.length > 0 ? (
                bullionHoldingsSummary.holdings.map((holding) => (
                  <div
                    key={holding.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium">
                          {holding.type} - {holding.form}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {holding.pureOunces.toFixed(2)} oz • {holding.purity}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(holding.calculatedValue)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No bullion holdings
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => navigate('/bullion-tracking')}
            >
              View Bullion Tracking
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>


      </div>

      {/* Quick Actions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Button onClick={() => navigate('/transactions')} variant="outline">
              Transactions
            </Button>
            <Button onClick={() => navigate('/fixed-dues')} variant="outline">
              Fixed Dues
            </Button>
            <Button onClick={() => navigate('/vibes-salary')} variant="outline">
              Vibes Salary
            </Button>
            <Button onClick={() => navigate('/money-tracking')} variant="outline">
              Money Tracker
            </Button>
            <Button onClick={() => navigate('/bullion-tracking')} variant="outline">
              Bullion
            </Button>
            <Button onClick={() => navigate('/reports')} variant="default">
              <BarChart3 className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
