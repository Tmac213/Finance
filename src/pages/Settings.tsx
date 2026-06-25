import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Moon, Sun, RefreshCw, Bell, Lock, History as HistoryIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useUIStore } from '@/store/uiStore';
import { dexieSync } from '@/lib/dexiesync';
import { useToast } from '@/components/ui/use-toast';
import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { exportComprehensivePDF } from '@/lib/exportUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNotification } from '@/contexts/NotificationContext';
import { HistorySheet } from '@/components/HistorySheet';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { isOffline, syncPending, lastSyncTime } = useUIStore();
  const { toast } = useToast();
  const {
    syncData,
    userSettings,
    updateUserSettings,
    transactions,
    fixedDues,
    bullionHoldings,
    moneyHoldings,
    vibesSalary
  } = useFinance();
  const { signOut } = useAuth();
  const { settings: notificationSettings, updateSettings: updateNotificationSettings, requestPermission, sendTestNotification } = useNotification();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAccessCodeDialogOpen, setIsAccessCodeDialogOpen] = useState(false);
  const [newAccessCode, setNewAccessCode] = useState('');
  const [isUpdatingAccessCode, setIsUpdatingAccessCode] = useState(false);
  const { changePassword } = useAuth();

  // Initialize dark mode from context
  useEffect(() => {
    if (userSettings && userSettings.theme) {
      setDarkMode(userSettings.theme === 'dark');
      // Ensure the class is applied (though context also does it, double safety)
      document.documentElement.classList.toggle('dark', userSettings.theme === 'dark');
    }
  }, [userSettings]);

  useEffect(() => {
    // Update offline status on mount and when navigator.onLine changes
    const updateOfflineStatus = () => {
      useUIStore.getState().setOffline(!navigator.onLine);
    };

    updateOfflineStatus(); // Check initial status

    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);

    return () => {
      window.removeEventListener('online', updateOfflineStatus);
      window.removeEventListener('offline', updateOfflineStatus);
    };
  }, []);

  useEffect(() => {
    // Update sync status based on UI store
    if (syncPending) {
      setSyncStatus('syncing');
      setSyncMessage('Sending data...');
    } else if (isOffline) {
      setSyncStatus('error');
      setSyncMessage('Offline - sync will happen when connection is restored');
    } else {
      setSyncStatus('idle');
      setSyncMessage('');
    }
  }, [syncPending, isOffline]);

  const handleExportPDF = () => {
    try {
      toast({
        title: 'Generating Report',
        description: 'Your comprehensive PDF report is being prepared...',
      });

      exportComprehensivePDF(
        transactions,
        fixedDues,
        bullionHoldings,
        moneyHoldings,
        vibesSalary
      );

      toast({
        title: 'Report Downloaded',
        description: 'Your report has been generated successfully.',
      });
    } catch (error) {
      console.error('PDF Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while generating the PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleThemeToggle = async (checked: boolean) => {
    setDarkMode(checked);
    const newTheme = checked ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', checked);

    // Save to synced settings
    await updateUserSettings({ theme: newTheme });
  };

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      const granted = await requestPermission();
      if (granted) {
        updateNotificationSettings({ enabled: true });
        toast({ title: 'Notifications Enabled', description: 'You will now receive alerts.' });
      } else {
        toast({ title: 'Permission Denied', description: 'Please enable notifications in your browser settings.', variant: 'destructive' });
        updateNotificationSettings({ enabled: false });
      }
    } else {
      updateNotificationSettings({ enabled: false });
    }
  };

  const handleSend = async () => {
    console.log('[Settings] handleSend called');
    setSyncStatus('syncing');
    setSyncMessage('Sending data...');

    try {
      console.log('[Settings] Calling dexieSync.sendAll()');
      const sendStats = await dexieSync.sendAll();
      console.log('[Settings] dexieSync.sendAll() completed, stats:', JSON.stringify(sendStats, null, 2));
      // Trigger full sync to reload data after send
      console.log('[Settings] Calling syncData(force=true) after send...');
      await syncData(true);
      setSyncStatus('success');
      setSyncMessage(`Send completed: ${sendStats.transactions.sent + sendStats.fixedDues.sent} items sent`);
      toast({
        title: 'Send Successful',
        description: 'All data has been sent to the server.',
      });
    } catch (error) {
      console.error('[Settings] Send error:', error);
      console.error('[Settings] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      setSyncStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setSyncMessage(`Send failed: ${errorMsg}`);
      toast({
        title: 'Send Failed',
        description: error instanceof Error ? error.message : 'Failed to send data. Please check your connection and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReceive = async () => {
    console.log('[Settings] handleReceive called');
    setSyncStatus('syncing');
    setSyncMessage('Receiving data from server...');

    try {
      console.log('[Settings] Calling dexieSync.receiveAll()');
      const receiveStats = await dexieSync.receiveAll();
      console.log('[Settings] dexieSync.receiveAll() completed, stats:', JSON.stringify(receiveStats, null, 2));
      // Trigger full sync to reload data after receive
      console.log('[Settings] Calling syncData(force=true) after receive...');
      await syncData(true);
      setSyncStatus('success');
      const receivedCount = receiveStats.transactions.received + receiveStats.fixedDues.received;
      setSyncMessage(`Receive completed: ${receivedCount} items received`);
      toast({
        title: 'Receive Successful',
        description: 'Latest data has been received from the server.',
      });
    } catch (error) {
      console.error('[Settings] Receive error:', error);
      console.error('[Settings] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      setSyncStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setSyncMessage(`Receive failed: ${errorMsg}`);
      toast({
        title: 'Receive Failed',
        description: error instanceof Error ? error.message : 'Failed to receive data. Please check your connection.',
        variant: 'destructive',
      });
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleLockApp = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to lock the app?\n\nThis will:\n• Clear the access code\n• Sign you out\n• Require the access code to be entered again\n\nYou will need to know the access code to get back in!'
    );

    if (confirmed) {
      try {
        // Clear the access code from sessionStorage
        sessionStorage.removeItem('app_access_granted');

        // Sign out the user
        await signOut();

        toast({
          title: 'App Locked',
          description: 'You have been signed out. Access code required to continue.',
        });

        // Force reload to show access code screen
        window.location.reload();
      } catch (error) {
        console.error('Error locking app:', error);
        toast({
          title: 'Error',
          description: 'Failed to lock app. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(newPassword);
      toast({
        title: 'Success',
        description: 'Password changed successfully.',
      });
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Change password error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password. Recent login may be required.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateAccessCode = () => {
    if (!newAccessCode) {
      toast({
        title: 'Error',
        description: 'Access code cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingAccessCode(true);
    try {
      localStorage.setItem('app_access_code', newAccessCode);
      toast({
        title: 'Success',
        description: 'Access code updated successfully.',
      });
      setIsAccessCodeDialogOpen(false);
      setNewAccessCode('');
    } catch (error) {
      console.error('Update access code error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update access code.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingAccessCode(false);
    }
  };

  const handleTripleClickSecret = () => {
    const now = Date.now();
    const clicks = (window as any).__secretClicks || [];
    clicks.push(now);
    (window as any).__secretClicks = clicks.filter((t: number) => now - t < 1000);

    if ((window as any).__secretClicks.length >= 3) {
      (window as any).__secretClicks = [];
      setIsAccessCodeDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the app looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode" className="flex items-center gap-2">
                {darkMode ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                Dark Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark theme
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your account security and password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <p className="text-sm text-muted-foreground">
                Change your account password
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Manage alerts for dues and reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow MistHub to send you alerts
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationSettings.enabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          {notificationSettings.enabled && (
            <>
              <div className="flex items-center justify-between ml-6 pl-4 border-l">
                <div className="space-y-0.5">
                  <Label htmlFor="fixed-due-alerts">Fixed Due Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify 3 days before due date
                  </p>
                </div>
                <Switch
                  id="fixed-due-alerts"
                  checked={notificationSettings.fixedDuesEnabled}
                  onCheckedChange={(checked) => updateNotificationSettings({ fixedDuesEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between ml-6 pl-4 border-l">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-reminder">Daily Reminder</Label>
                  <p className="text-sm text-muted-foreground">
                    Remind me to log transactions at 8 PM
                  </p>
                </div>
                <Switch
                  id="daily-reminder"
                  checked={notificationSettings.dailyReminderEnabled}
                  onCheckedChange={(checked) => updateNotificationSettings({ dailyReminderEnabled: checked })}
                />
              </div>

              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={sendTestNotification}>
                  Send Test Notification
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Synchronization</CardTitle>
          <CardDescription>
            Sync your data between local storage and the server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Last Sync</Label>
                <p className="text-sm text-muted-foreground">
                  {formatLastSync(lastSyncTime)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSend}
                  disabled={syncStatus === 'syncing'}
                  variant="outline"
                >
                  {syncStatus === 'syncing' ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Send
                </Button>
                <Button
                  onClick={handleReceive}
                  disabled={syncStatus === 'syncing'}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Receive
                </Button>
              </div>
            </div>
            {syncMessage && (
              <Alert variant={syncStatus === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{syncMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download your financial data and reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button onClick={handleExportPDF} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export to PDF
            </Button>
            <p className="text-xs text-muted-foreground">
              Generate a comprehensive PDF report of all your financial data
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span
                className="font-medium cursor-pointer select-none hover:text-destructive transition-colors"
                onClick={(e) => {
                  // Triple-click to lock
                  const now = Date.now();
                  const clicks = (window as any).__lockClicks || [];
                  clicks.push(now);
                  (window as any).__lockClicks = clicks.filter((t: number) => now - t < 1000);

                  if ((window as any).__lockClicks.length >= 3) {
                    (window as any).__lockClicks = [];
                    handleLockApp();
                  }
                }}
              >
                1.1.0
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial Start</span>
              <span
                className="font-medium cursor-pointer"
                onClick={handleTripleClickSecret}
              >
                {userSettings.historyStartDate ? format(userSettings.historyStartDate, 'MMMM yyyy') : 'October 2025'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">February 2026</span>
            </div>
          </div>
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

      <HistorySheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entityType="settings"
        title="Settings History"
      />

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter a new password for your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAccessCodeDialogOpen} onOpenChange={setIsAccessCodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Access Code</DialogTitle>
            <DialogDescription>
              Enter a new access code for the application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-access-code">New Access Code</Label>
              <Input
                id="new-access-code"
                type="text"
                value={newAccessCode}
                onChange={(e) => setNewAccessCode(e.target.value)}
                placeholder="e.g. 1234"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAccessCodeDialogOpen(false)}
              disabled={isUpdatingAccessCode}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAccessCode}
              disabled={isUpdatingAccessCode || !newAccessCode}
            >
              {isUpdatingAccessCode ? 'Updating...' : 'Update Access Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
