"use client";

import { useState, useEffect, useCallback } from "react";

export interface QueuedOfflineItem {
  id: string;
  type: "NFI" | "CALIBRATION" | "DOCUMENT" | "SITE_REPORT" | "NCR";
  action: "CREATE" | "UPDATE";
  payload: Record<string, any>;
  timestamp: string;
  projectName?: string;
}

const STORAGE_KEY = "aei_qca_offline_queue_v1";

export function getOfflineQueue(): QueuedOfflineItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedOfflineItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Gagal menyimpan antrean offline:", err);
  }
}

export function enqueueOfflineItem(
  type: QueuedOfflineItem["type"],
  action: QueuedOfflineItem["action"],
  payload: Record<string, any>,
  projectName?: string
): QueuedOfflineItem {
  const item: QueuedOfflineItem = {
    id: `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    action,
    payload,
    timestamp: new Date().toISOString(),
    projectName,
  };

  const queue = getOfflineQueue();
  queue.push(item);
  saveOfflineQueue(queue);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("offline-queue-updated", { detail: { count: queue.length } }));
  }

  return item;
}

export async function flushOfflineQueue(
  onProgress?: (synced: number, total: number) => void
): Promise<{ success: boolean; count: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { success: true, count: 0 };

  const total = queue.length;
  let synced = 0;
  const remaining: QueuedOfflineItem[] = [];

  for (const item of queue) {
    try {
      // Dispatch to GAS API proxy
      await fetch("/api/gas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "syncOfflineItem",
          itemType: item.type,
          itemAction: item.action,
          payload: item.payload,
          timestamp: item.timestamp,
        }),
      });
      synced++;
      if (onProgress) onProgress(synced, total);
    } catch {
      // Keep in queue if failed
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("offline-queue-updated", { detail: { count: remaining.length } }));
    window.dispatchEvent(new CustomEvent("offline-sync-complete", { detail: { syncedCount: synced } }));
  }

  return { success: true, count: synced };
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  const [queueCount, setQueueCount] = useState<number>(() => {
    return getOfflineQueue().length;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshQueueCount = useCallback(() => {
    setQueueCount(getOfflineQueue().length);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-flush queue when reconnected
      const q = getOfflineQueue();
      if (q.length > 0) {
        setIsSyncing(true);
        flushOfflineQueue().finally(() => {
          setIsSyncing(false);
          refreshQueueCount();
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueUpdated = () => {
      refreshQueueCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-queue-updated", handleQueueUpdated);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-queue-updated", handleQueueUpdated);
    };
  }, [refreshQueueCount]);

  const triggerManualSync = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      await flushOfflineQueue();
    } finally {
      setIsSyncing(false);
      refreshQueueCount();
    }
  };

  return {
    isOnline,
    queueCount,
    isSyncing,
    triggerManualSync,
    enqueueOfflineItem,
  };
}
