"use client";

import { Button } from "@/components/ui/button";

export function BackupButton() {
  const handleClick = async () => {
    const res = await fetch("/api/backup", { cache: "no-store" });
    if (!res.ok) {
      alert("Backup failed.");
      return;
    }
    const blob = await res.blob();
    const filename = `seekant-electricals-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button type="button" variant="ghost" onClick={handleClick}>
      Backup Data
    </Button>
  );
}
