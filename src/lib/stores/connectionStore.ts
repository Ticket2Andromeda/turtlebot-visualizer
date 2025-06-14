import { writable } from "svelte/store";

export const rosConnection = writable<any | null>(null);
export const turtlebotSpawnStatus = writable<
  "notStarted" | "inProgress" | "complete" | "terminated"
>("notStarted");
export const domain = writable<string | undefined>(undefined);
export const remainingSessionTime = writable<number>(600000);
