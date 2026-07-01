import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "low" | "warn";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn("pill", variant === "low" && "low", variant === "warn" && "warn", className)}
      {...props}
    />
  );
}
