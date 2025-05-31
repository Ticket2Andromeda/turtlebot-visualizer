import ROSLIB from "roslib";
import { get } from "svelte/store";
import {
  domain,
  rosConnection,
  turtlebotSpawnStatus,
} from "../stores/connectionStore";

export const connectToROS = () => {
  const host = get(domain);
  console.log("searching for", get(domain));
  if (!host) {
    throw new Error(`Host at ip ${host} is not defined`);
  }
  const ros = new ROSLIB.Ros({
    url: host,
  });

  ros.on("connection", () => {
    console.log(`Connected to ROS. On Host: ${host}`);
  });

  ros.on("error", (error) => {
    console.error("Connection error:", error, `connecting to ${host}`);
  });

  ros.on("close", () => {
    console.log(`Connection  to ${host} closed.`);
  });

  console.log("ros1", ros);
  return ros;
};

export function establishConnectionPlaceholder(interval = 1000) {
  const timer = setInterval(() => {
    const host = get(domain);

    console.log("the host should be", host);
    if (host) {
      const ros = connectToROS();

      ros.on("connection", () => {
        console.log("✅ Connected to ROS!");
        rosConnection.set(ros);
        turtlebotSpawnStatus.set("complete");
        clearInterval(timer);
      });

      ros.on("error", (err) => {
        console.warn("❌ Failed attempt to connect:", err.message);
      });

      ros.on("close", () => {
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
    if (!uuid) {
      uuid = crypto.randomUUID();
      localStorage.setItem("uuid", uuid);
    }
    console.log("UuId", uuid);
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
    // const data = await res.json();
    // console.log("Spawn response:", data);

    // // Assuming API returns some useful info like { instanceIp, status }
    // console.log("We tried!!");
  } catch (err) {
    console.error("Failed to spawn turtlebot:", err);
  }
}
