"use client";

import { useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RestoreButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      startTransition(async () => {
        const res = await fetch("/api/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: text,
        });
        if (res.ok) {
          alert("Data restored successfully.");
          window.location.reload();
        } else {
          alert("That backup file could not be restored.");
        }
        if (inputRef.current) inputRef.current.value = "";
      });
    };
    reader.readAsText(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />
      <Button
        type="button"
        variant="ghost"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        {pending ? "Restoring..." : "Restore Data"}
      </Button>
    </>
  );
}
