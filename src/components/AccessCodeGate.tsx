import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

// Fallback access code if none is set in localStorage
const DEFAULT_ACCESS_CODE = '1234';
const ACCESS_CODE_KEY = 'app_access_granted';
const ACCESS_CODE_VALUE_KEY = 'app_access_code';

interface AccessCodeGateProps {
    children: React.ReactNode;
}

export function AccessCodeGate({ children }: AccessCodeGateProps) {
    const [hasAccess, setHasAccess] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentAccessCode, setCurrentAccessCode] = useState(DEFAULT_ACCESS_CODE);

    // Session storage key for access (cleared on tab close)
    const SESSION_ACCESS_KEY = 'app_access_granted';
    const INACTIVITY_TIMEOUT = 30000; // 30 seconds

    useEffect(() => {
        // Load the current access code from storage (persistent)
        const storedCode = localStorage.getItem(ACCESS_CODE_VALUE_KEY);
        if (storedCode) {
            setCurrentAccessCode(storedCode);
        }
        // Check if user has already entered the correct code in this session
        const storedAccess = sessionStorage.getItem(SESSION_ACCESS_KEY);
        if (storedAccess === 'true') {
            setHasAccess(true);
        }
        setLoading(false);
    }, []);

    // Inactivity timer effect
    useEffect(() => {
        if (!hasAccess) return;

        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.log('[AccessCodeGate] Inactivity timeout reached. Locking app.');
                sessionStorage.removeItem(SESSION_ACCESS_KEY);
                setHasAccess(false);
            }, INACTIVITY_TIMEOUT);
        };

        const activityEvents = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click'
        ];

        // Initial timer set
        resetTimer();

        // Add event listeners
        activityEvents.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [hasAccess]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (code === currentAccessCode) {
            sessionStorage.setItem(SESSION_ACCESS_KEY, 'true');
            setHasAccess(true);
            setError('');
        } else {
            setError('Invalid access code. Please try again.');
            setCode('');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Access Code Required</CardTitle>
                        <CardDescription>
                            Enter the access code to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="accessCode">Access Code</Label>
                                <Input
                                    id="accessCode"
                                    type="password"
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Enter access code"
                                    required
                                    autoFocus
                                    className={error ? 'border-destructive' : ''}
                                />
                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full">
                                Submit
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}
