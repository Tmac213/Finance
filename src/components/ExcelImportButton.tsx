import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface ExcelImportButtonProps {
    onImport: (data: any[]) => Promise<void>;
    expectedColumns: string[];
    parseRow: (row: any) => any;
    validateRow?: (row: any) => { valid: boolean; errors: string[] };
    templateDownloadFn?: () => void;
}

export function ExcelImportButton({
    onImport,
    expectedColumns,
    parseRow,
    validateRow,
    templateDownloadFn,
}: ExcelImportButtonProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            if (jsonData.length === 0) {
                toast({
                    title: 'Empty File',
                    description: 'The Excel file appears to be empty.',
                    variant: 'destructive',
                });
                return;
            }

            // Parse and validate data
            const parsed = jsonData.map((row, index) => {
                try {
                    const parsedRow = parseRow(row);
                    const validation = validateRow
                        ? validateRow(parsedRow)
                        : { valid: true, errors: [] };
                    return {
                        ...parsedRow,
                        _rowIndex: index + 1,
                        _valid: validation.valid,
                        _errors: validation.errors,
                    };
                } catch (error) {
                    return {
                        _rowIndex: index + 1,
                        _valid: false,
                        _errors: [error instanceof Error ? error.message : 'Parse error'],
                    };
                }
            });

            setPreviewData(parsed);
            setIsPreviewOpen(true);
        } catch (error) {
            toast({
                title: 'Import Error',
                description: error instanceof Error ? error.message : 'Failed to read Excel file',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const handleConfirmImport = async () => {
        const validRows = previewData.filter((row) => row._valid);
        if (validRows.length === 0) {
            toast({
                title: 'No Valid Data',
                description: 'Please fix the errors before importing.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsLoading(true);
            await onImport(validRows);
            toast({
                title: 'Import Successful',
                description: `Imported ${validRows.length} row(s)${previewData.length - validRows.length > 0
                    ? `, skipped ${previewData.length - validRows.length} invalid row(s)`
                    : ''
                    }`,
            });
            setIsPreviewOpen(false);
            setPreviewData([]);
        } catch (error) {
            toast({
                title: 'Import Failed',
                description: error instanceof Error ? error.message : 'Failed to import data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex gap-2">
                {templateDownloadFn && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={templateDownloadFn}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Download Template
                    </Button>
                )}
                <input
                    type="file"
                    id="excel-upload"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('excel-upload')?.click()}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Import Excel
                        </>
                    )}
                </Button>
            </div>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Preview Import Data</DialogTitle>
                        <DialogDescription>
                            Review the data before importing. Invalid rows are highlighted.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Row</TableHead>
                                        <TableHead>Status</TableHead>
                                        {expectedColumns.map((col) => (
                                            <TableHead key={col}>{col}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.slice(0, 50).map((row) => (
                                        <TableRow
                                            key={row._rowIndex}
                                            className={!row._valid ? 'bg-destructive/10' : ''}
                                        >
                                            <TableCell>{row._rowIndex}</TableCell>
                                            <TableCell>
                                                {row._valid ? (
                                                    <span className="text-green-600">✓</span>
                                                ) : (
                                                    <span className="text-red-600" title={row._errors?.join(', ')}>
                                                        ✗
                                                    </span>
                                                )}
                                            </TableCell>
                                            {expectedColumns.map((col) => (
                                                <TableCell key={col}>
                                                    {String(row[col] || '')}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {previewData.length > 50 && (
                            <p className="text-sm text-muted-foreground">
                                Showing first 50 rows of {previewData.length} total
                            </p>
                        )}

                        <div className="flex justify-between">
                            <div className="text-sm text-muted-foreground">
                                Valid: {previewData.filter((r) => r._valid).length} | Invalid:{' '}
                                {previewData.filter((r) => !r._valid).length}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleConfirmImport} disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        `Import ${previewData.filter((r) => r._valid).length} Row(s)`
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
