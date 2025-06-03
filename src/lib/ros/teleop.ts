// import ROSLIB from "roslib";
import "roslib/build/roslib";

let cmdVelPublisher: ROSLIB.Topic;

export const initTeleop = (ros: ROSLIB.Ros) => {
  cmdVelPublisher = new window.ROSLIB.Topic({
    ros,
    name: "/cmd_vel",
    messageType: "geometry_msgs/Twist",
  });
};

export const sendCmdVel = (linear: number, angular: number) => {
  if (!cmdVelPublisher) return;

  const twist = new window.ROSLIB.Message({
    linear: { x: linear, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: angular },
  });

  cmdVelPublisher.publish(twist);
};
