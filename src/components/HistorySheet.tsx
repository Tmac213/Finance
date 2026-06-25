import React, { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { useFinance } from '@/contexts/FinanceContext';
import { format } from 'date-fns';
import { Clock, ChevronDown, ChevronUp, History, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HistorySheetProps {
    isOpen: boolean;
    onClose: () => void;
    entityId?: string;
    entityType?: string;
    title: string;
}

export function HistorySheet({ isOpen, onClose, entityId, entityType, title }: HistorySheetProps) {
    const { getHistoryLogs, updateUserSettings } = useFinance();
    const [logs, setLogs] = useState<any[]>([]);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadLogs();
        }
    }, [isOpen, entityId, entityType]);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const history = await getHistoryLogs(entityId, entityType);
            setLogs(history);
        } catch (error) {
            console.error('Failed to load history logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearView = async () => {
        if (window.confirm('Are you sure you want to clear the current history view? Old logs will be hidden but not deleted.')) {
            await updateUserSettings({ historyStartDate: Date.now() });
            loadLogs();
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'add': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'update': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'delete': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const renderDiff = (before: any, after: any) => {
        if (!before && !after) return null;

        // Simple JSON diff view
        const b = before ? JSON.parse(before) : null;
        const a = after ? JSON.parse(after) : null;

        return (
            <div className="mt-4 space-y-4 text-xs font-mono bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-hidden">
                {b && (
                    <div className="space-y-1">
                        <div className="text-red-400 font-bold uppercase tracking-wider text-[10px]">Before:</div>
                        <pre className="text-red-300/80 overflow-x-auto pb-2 whitespace-pre-wrap">
                            {JSON.stringify(b, null, 2)}
                        </pre>
                    </div>
                )}
                {a && (
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                        <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">After:</div>
                        <pre className="text-emerald-300/80 overflow-x-auto pt-2 whitespace-pre-wrap">
                            {JSON.stringify(a, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl bg-slate-900 border-slate-800 text-slate-100 p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <History className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold text-white tracking-tight">Modification History</SheetTitle>
                            <SheetDescription className="text-slate-400 text-xs">
                                {title} • {logs.length} modification{logs.length !== 1 ? 's' : ''} found
                            </SheetDescription>
                        </div>
                    </div>
                    {logs.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearView}
                            className="absolute right-14 top-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                            title="Clear History View (Hide old logs)"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="text-xs font-medium">Clear View</span>
                        </Button>
                    )}
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-slate-400 animate-pulse font-medium">Retrieving audit logs...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                                <div className="p-4 bg-slate-900 rounded-full mb-4">
                                    <Info className="h-8 w-8 text-slate-600" />
                                </div>
                                <p className="text-slate-400 font-medium tracking-tight">No history found</p>
                                <p className="text-slate-500 text-xs mt-1">Changes are only tracked from now on.</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`group relative overflow-hidden transition-all duration-300 rounded-2xl border ${expandedLog === log.id
                                        ? 'bg-slate-800/80 border-slate-700 shadow-2xl'
                                        : 'bg-slate-950/50 border-slate-900 hover:border-slate-800 hover:bg-slate-900/50 shadow-sm'
                                        }`}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`capitalize text-[10px] font-bold h-5 px-2 tracking-wide ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </Badge>
                                                    <span className="text-slate-500 text-xs">•</span>
                                                    <span className="text-slate-300 text-xs font-semibold">
                                                        {format(log.timestamp, 'MMM d, yyyy • h:mm a')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">IP Address</span>
                                                    <span className="text-[11px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                                        {log.ip_address || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-800"
                                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                            >
                                                {expandedLog === log.id ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>

                                        {expandedLog === log.id && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                {renderDiff(log.before, log.after)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
