import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useFinance } from './FinanceContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

interface NotificationSettings {
    enabled: boolean;
    fixedDuesEnabled: boolean;
    dailyReminderEnabled: boolean;
    lastDailyReminderDate: string; // YYYY-MM-DD
}

interface NotificationContextType {
    settings: NotificationSettings;
    updateSettings: (newSettings: Partial<NotificationSettings>) => void;
    requestPermission: () => Promise<boolean>;
    sendTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// Default settings
const DEFAULT_SETTINGS: NotificationSettings = {
    enabled: false,
    fixedDuesEnabled: true,
    dailyReminderEnabled: true,
    lastDailyReminderDate: '',
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { fixedDues } = useFinance();
    const [settings, setSettings] = useState<NotificationSettings>(() => {
        const saved = localStorage.getItem('notification_settings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });

    // Save settings to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('notification_settings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings: Partial<NotificationSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const requestPermission = async (): Promise<boolean> => {
        const platform = Capacitor.getPlatform();

        if (platform === 'web') {
            if (!('Notification' in window)) {
                console.warn('This browser does not support desktop notification');
                return false;
            }

            if (Notification.permission === 'granted') {
                updateSettings({ enabled: true });
                return true;
            }

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                updateSettings({ enabled: true });
                return true;
            }
        } else {
            const status = await LocalNotifications.requestPermissions();
            if (status.display === 'granted') {
                updateSettings({ enabled: true });
                return true;
            }
        }

        updateSettings({ enabled: false });
        return false;
    };

    const sendNotification = async (title: string, body: string) => {
        if (!settings.enabled) return;

        const platform = Capacitor.getPlatform();

        try {
            if (platform === 'web') {
                if (Notification.permission !== 'granted') return;
                new Notification(title, {
                    body,
                    icon: '/pwa-192x192.png',
                });
            } else {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title,
                            body,
                            id: Math.floor(Math.random() * 1000000),
                            schedule: { at: new Date(Date.now() + 500) }, // Send in 0.5s
                            sound: undefined,
                            attachments: undefined,
                            actionTypeId: "",
                            extra: null
                        }
                    ]
                });
            }
        } catch (e) {
            console.error('Error sending notification:', e);
        }
    };

    const sendTestNotification = async () => {
        const granted = await requestPermission();
        if (granted) {
            await sendNotification('MistHub Test', 'This is a test notification to verify your settings.');
        }
    };

    // Check for Fixed Dues
    useEffect(() => {
        if (!settings.enabled || !settings.fixedDuesEnabled) return;

        const checkFixedDues = async () => {
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);

            for (const due of fixedDues) {
                if (due.isPaid) continue;
                if (!due.dueDate) continue;

                const dueDate = new Date(due.dueDate);
                const timeDiff = dueDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                // Notify if due within 3 days (inclusive) or overdue
                if (daysDiff <= 3) {
                    const notifiedKey = `notified_due_${due.id}_${today.toDateString()}`;
                    if (localStorage.getItem(notifiedKey)) continue;

                    let body = '';
                    if (daysDiff < 0) {
                        body = `Your payment for ${due.name} was due on ${due.dueDate}.`;
                    } else if (daysDiff === 0) {
                        body = `Your payment for ${due.name} is due TODAY!`;
                    } else {
                        body = `Your payment for ${due.name} is due in ${daysDiff} days (${due.dueDate}).`;
                    }

                    await sendNotification(`Upcoming Bill: ${due.name}`, body);
                    localStorage.setItem(notifiedKey, 'true');
                }
            }
        };

        checkFixedDues();
        const interval = setInterval(checkFixedDues, 60 * 60 * 1000);
        return () => clearInterval(interval);

    }, [fixedDues, settings.enabled, settings.fixedDuesEnabled]);

    // Check for Daily Reminder
    useEffect(() => {
        if (!settings.enabled || !settings.dailyReminderEnabled) return;

        const checkDailyReminder = async () => {
            const now = new Date();
            const currentHour = now.getHours();
            const todayStr = now.toISOString().split('T')[0];

            if (currentHour >= 20 && settings.lastDailyReminderDate !== todayStr) {
                await sendNotification('Daily Finance Check-in', 'Did you pay anything today? Open MistHub to log your transactions!');
                updateSettings({ lastDailyReminderDate: todayStr });
            }
        };

        checkDailyReminder();
        const interval = setInterval(checkDailyReminder, 30 * 60 * 1000);
        return () => clearInterval(interval);

    }, [settings.enabled, settings.dailyReminderEnabled, settings.lastDailyReminderDate]);

    return (
        <NotificationContext.Provider value={{
            settings,
            updateSettings,
            requestPermission,
            sendTestNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
