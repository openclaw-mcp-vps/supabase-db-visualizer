import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "min-h-20 w-full rounded-md border border-[#30363d] bg-[#0f141b] px-3 py-2 text-sm text-[#e6edf3] placeholder:text-[#6e7681] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]/60",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
