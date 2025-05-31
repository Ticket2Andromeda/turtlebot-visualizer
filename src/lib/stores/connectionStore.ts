import { writable } from "svelte/store";

export const rosConnection = writable<ROSLIB.Ros | null>(null);
export const turtlebotSpawnStatus = writable<
  "notStarted" | "inProgress" | "complete"
>("notStarted");
export const domain = writable<string | undefined>(undefined);
