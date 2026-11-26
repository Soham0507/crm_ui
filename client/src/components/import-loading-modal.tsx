import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Upload } from "lucide-react";

interface ImportLoadingModalProps {
  isOpen: boolean;
  contactCount?: number;
}

export default function ImportLoadingModal({
  isOpen,
  contactCount,
}: ImportLoadingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Importing Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-brand animate-spin mb-4" />
            <p className="text-gray-700 text-center font-medium">
              Creating your contacts...
            </p>
            {contactCount !== undefined && (
              <p className="text-sm text-gray-500 mt-2">
                Processing {contactCount} contact{contactCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="bg-brand-soft rounded-xl p-4">
            <p className="text-sm text-brand-deep text-center">
              This may take a few moments. Please don't close this window.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
