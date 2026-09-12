'use client';

import { useCallback, useState } from "react";
import { LucideKeyRound, LucideTrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteApiKey } from "@/actions";
import { useDomain } from "@/hooks/useDomain";
import { useToast } from "@/components/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getDisplayTime, isServiceError } from "@/lib/utils";

interface ApiKey {
    id: string;
    name: string;
    preview: string;
    createdAt: Date;
    lastUsedAt: Date | null;
}

interface ApiKeysListProps {
    apiKeys: ApiKey[];
}

export const ApiKeysList = ({ apiKeys }: ApiKeysListProps) => {
    const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
    const domain = useDomain();
    const { toast } = useToast();
    const router = useRouter();

    const onDelete = useCallback(() => {
        if (!keyToDelete) {
            return;
        }

        deleteApiKey(keyToDelete.id, domain)
            .then((response) => {
                if (isServiceError(response)) {
                    toast({ description: `❌ Failed to revoke key. Reason: ${response.message}` });
                } else {
                    toast({ description: `✅ Key revoked.` });
                    router.refresh();
                }
            })
            .finally(() => setKeyToDelete(null));
    }, [keyToDelete, domain, router, toast]);

    if (apiKeys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
                <LucideKeyRound className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No API keys yet.</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col rounded-lg border divide-y">
                {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex flex-row items-center justify-between gap-4 p-4">
                        <div className="flex flex-row items-center gap-3 min-w-0">
                            <LucideKeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{apiKey.name}</p>
                                <p className="truncate font-mono text-xs text-muted-foreground">
                                    {apiKey.preview}…
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-row items-center gap-6 shrink-0">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs text-muted-foreground">
                                    Created {getDisplayTime(apiKey.createdAt)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {apiKey.lastUsedAt
                                        ? `Last used ${getDisplayTime(apiKey.lastUsedAt)}`
                                        : "Never used"}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Revoke ${apiKey.name}`}
                                onClick={() => setKeyToDelete(apiKey)}
                            >
                                <LucideTrash className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={keyToDelete !== null} onOpenChange={(open) => !open && setKeyToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke &quot;{keyToDelete?.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anything still using this key stops working immediately. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete}>Revoke</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
