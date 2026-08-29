import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QuotationDeleteModal({
    quotation,
    onCancel,
    onConfirm,
}) {
    return (
        <AlertDialog
            open={Boolean(quotation)}
            onOpenChange={(open) => {
                if (!open) {
                    onCancel?.();
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Deactivate Quotation?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        Quotation{" "}
                        <strong>
                            {quotation?.quote_number}
                        </strong>{" "}
                        will be removed from the active
                        register.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}