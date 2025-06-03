import { writable } from "svelte/store";

export const rosConnection = writable<ROSLIB.Ros | null>(null);
export const turtlebotSpawnStatus = writable<
  "notStarted" | "inProgress" | "complete" | "terminated"
>("notStarted");
export const domain = writable<string | undefined>(undefined);
export const sessionTimeRemaining = writable<number>(0);
