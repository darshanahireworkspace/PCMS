import localforage from "localforage";
import API from "../api/axios";

const QUEUE_KEY = "offline_queue";

export const addToOfflineQueue = async (request) => {
  const queue = (await localforage.getItem(QUEUE_KEY)) || [];
  queue.push({ ...request, createdAt: new Date().toISOString() });
  await localforage.setItem(QUEUE_KEY, queue);
};

export const getOfflineQueue = async () => {
  return (await localforage.getItem(QUEUE_KEY)) || [];
};

export const clearOfflineQueue = async () => {
  await localforage.setItem(QUEUE_KEY, []);
};

export const syncOfflineQueue = async () => {
  const queue = await getOfflineQueue();

  if (!navigator.onLine || queue.length === 0) return;

  const remaining = [];

  for (const item of queue) {
    try {
      await API({
        method: item.method,
        url: item.url,
        data: item.data,
        headers: item.headers || {},
      });
    } catch {
      remaining.push(item);
    }
  }

  await localforage.setItem(QUEUE_KEY, remaining);
};