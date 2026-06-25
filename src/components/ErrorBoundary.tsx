import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-background p-4">
                    <Card className="w-full max-w-md border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Something went wrong</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                An unexpected error occurred. Please try reloading the page.
                            </p>

                            {this.state.error && (
                                <div className="p-2 bg-muted rounded text-xs font-mono overflow-auto max-h-[200px] border">
                                    <strong>{this.state.error.toString()}</strong>
                                    {this.state.errorInfo && (
                                        <pre className="mt-2">{this.state.errorInfo.componentStack}</pre>
                                    )}
                                </div>
                            )}

                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reload Application
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
