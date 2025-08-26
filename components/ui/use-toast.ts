"use client";

import { toast } from "./sonner";

type ToastOptions = {
  title: string;
  description: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  return {
    toast: (options: ToastOptions) => {
      if (options.variant === "destructive") {
        toast.error(options.title, {
          description: options.description,
        });
      } else {
        toast.default(options.title, {
          description: options.description,
        });
      }
    },
  };
}
