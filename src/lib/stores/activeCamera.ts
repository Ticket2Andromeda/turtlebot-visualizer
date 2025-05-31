import { writable } from "svelte/store";

export const activeCamera = writable<"scene" | "robot" | "sensor">("scene");
