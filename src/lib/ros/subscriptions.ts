import ROSLIB from "roslib";

export const connectToROS = (host = "ws://localhost:9090") => {
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

  return ros;
};

export const subscribeToMap = (
  ros: ROSLIB.Ros,
  callback: (msg: any) => void
) => {
  const mapListener = new ROSLIB.Topic({
    ros,
    name: "/map",
    messageType: "nav_msgs/OccupancyGrid",
  });
  mapListener.subscribe(callback);
  return mapListener; // you can use this to unsubscribe later if needed
};

export const subscribeToPointCloud = (
  ros: ROSLIB.Ros,
  callback: (msg: any) => void
) => {
  const pointCloudListener = new ROSLIB.Topic({
    ros,
    name: "/scan",
    messageType: "sensor_msgs/LaserScan",
  });
  pointCloudListener.subscribe(callback);

  return pointCloudListener; // you can use this to unsubscribe later if needed
};

export const subscribeToTF = (
  ros: ROSLIB.Ros,
  callback: (msg: any) => void
) => {
  const tfListener = new ROSLIB.Topic({
    ros,
    name: "/tf",
    messageType: "tf2_msgs/TFMessage",
  });
  tfListener.subscribe(callback);

  return tfListener; // you can use this to unsubscribe later if needed
};

export const subscribeToBaseLinkTransform = (
  ros: ROSLIB.Ros,
  callback: (transform: ROSLIB.Transform) => void
) => {
  const tfListener = new ROSLIB.Topic({
    ros,
    name: "/tf",
    messageType: "tf2_msgs/TFMessage",
  });

  tfListener.subscribe((msg: any) => {
    // Search for base_link transform in the array
    const transform = msg.transforms.find(
      (t: any) =>
        t.child_frame_id === "base_link" && t.header.frame_id === "map"
    );

    if (transform) {
      callback(transform.transform);
    }
  });

  return tfListener;
};

export const subscribeToCameraSensor = (
  ros: ROSLIB.Ros,
  callback: (msg: any) => void
) => {
  const cameraSensorListener = new ROSLIB.Topic({
    ros,
    name: "/camera/rgb/image_raw/compressed", // or raw, if you're decoding manually
    messageType: "sensor_msgs/CompressedImage",
  });
  cameraSensorListener.subscribe(callback);

  return cameraSensorListener; // you can use this to unsubscribe later if needed
};
