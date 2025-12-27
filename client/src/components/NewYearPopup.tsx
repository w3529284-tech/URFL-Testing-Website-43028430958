import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

interface NewYearPopupProps {
  onClose: () => void;
}

export function NewYearPopup({ onClose }: NewYearPopupProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const audio = new Audio("data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==");
    audio.play().catch(() => {});
  }, []);

  const handleClose = async () => {
    if (user?.id) {
      try {
        await fetch("/api/user/popup-status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ popupType: "newYear", seen: true }),
        });
        // Invalidate the user query to force a refetch with updated popup status
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } catch (err) {
        console.error("Failed to update popup status:", err);
      }
    }
    onClose();
  };

  return null;
}
