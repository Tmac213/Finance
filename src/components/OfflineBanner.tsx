import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUIStore } from '@/store/uiStore';

export function OfflineBanner() {
  const isOffline = useUIStore((s) => s.isOffline);

  if (!isOffline) return null;

  return (
    <div className="p-2">
      <Alert>
        <AlertDescription>
          You are offline. Changes will sync when connection is restored.
        </AlertDescription>
      </Alert>
    </div>
  );
}


