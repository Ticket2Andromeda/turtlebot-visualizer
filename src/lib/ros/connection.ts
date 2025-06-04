// import ROSLIB from "roslib";
import "roslib/build/roslib";

import { get } from "svelte/store";
import {
  domain,
  remainingSessionTime,
  rosConnection,
  turtlebotSpawnStatus,
} from "../stores/connectionStore";

export async function establishConnection(interval = 5000) {
  const timer = setInterval(() => {
    const host = get(domain);

    if (host) {
      const ros = new window.ROSLIB.Ros({
        url: host,
      });

      ros.on("connection", () => {
        console.log("✅ Connected to ROS!");
        rosConnection.set(ros);
        turtlebotSpawnStatus.set("complete");
        clearInterval(timer);
      });

      ros.on("error", (err) => {
        rosConnection.set(null);
        console.warn("❌ Failed attempt to connect:", err.message);
      });

      ros.on("close", () => {
        const status = get(turtlebotSpawnStatus);
        rosConnection.set(null);
        if (status === "complete") {
          turtlebotSpawnStatus.set("terminated");
        }
        console.log("Connection closed — will retry.");
      });
    } else {
      console.log("Host has yet to spawn.");
    }
  }, interval);
}

export async function spawnTurtlebot() {
  try {
    let uuid = localStorage.getItem("uuid");
    let uuidTtl = localStorage.getItem("uuidTTL");
    let activateDelay: boolean = false;
    const now = new Date();

    if (uuidTtl && new Date(uuidTtl).getTime() < now.getTime()) {
      uuid = crypto.randomUUID();
      localStorage.setItem("uuid", uuid);

      const tenMinutesLater = new Date(now.getTime() + 10 * 60000);
      localStorage.setItem("uuidTTL", tenMinutesLater.toISOString());
      activateDelay = true;
    }

    if (!uuid) {
      uuid = crypto.randomUUID();
      localStorage.setItem("uuid", uuid);

      const tenMinutesLater = new Date(now.getTime() + 10 * 60000);
      localStorage.setItem("uuidTTL", tenMinutesLater.toISOString());
      activateDelay = true;
    }

    const ttl = localStorage.getItem("uuidTTL");
    if (ttl) {
      const timeRemaining = new Date(ttl).getTime() - Date.now();
      remainingSessionTime.set(timeRemaining > 0 ? timeRemaining : 0);
    }

    const res = await fetch(
      "https://rpsqjcbxai.execute-api.us-east-2.amazonaws.com/spawn-turtlebot",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid }),
      }
    );

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }

    domain.set(`wss://${uuid}.ticket2andromeda.com/rosbridge/`);
    console.log("retrieved host", get(domain));

    if (activateDelay) {
      await delay(60000);
    }
  } catch (err) {
    console.error("Failed to spawn turtlebot:", err);
  }
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms)); // wait 60 seconds
}
