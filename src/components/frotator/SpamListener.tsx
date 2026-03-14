import { useEffect } from "react";
import { toast } from "sonner";
import { subscribe } from "@/lib/spamSSE";

// Random ID unique to this browser tab, used to suppress
// toasts for messages sent from this tab only.
export const TAB_ID = crypto.randomUUID();

export default function SpamListener() {
  useEffect(() => {
    return subscribe((msg) => {
      if (msg.tabId !== TAB_ID) {
        toast.info(`${msg.name}: ${msg.text}`, {
          duration: 5000,
        });
      }
    });
  }, []);

  return null;
}
