import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: string;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: error.message
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('Error caught by ErrorBoundary:', error, errorInfo);
        }

        // TODO: Log to error tracking service (e.g., Sentry) in production
        // if (import.meta.env.PROD) {
        //   logErrorToService(error, errorInfo);
        // }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                                <CardTitle className="text-2xl">Something went wrong</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                We're sorry, but something unexpected happened. This error has been logged
                                and we'll look into it.
                            </p>

                            {import.meta.env.DEV && this.state.error && (
                                <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-sm font-mono text-destructive break-all">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <p className="text-xs font-mono text-muted-foreground mt-2">
                                            {this.state.errorInfo}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    onClick={this.handleReset}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    onClick={this.handleReload}
                                    className="flex-1"
                                >
                                    Reload Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
