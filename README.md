# Turtle Bot Visualizer

This project visualizes a Turtle Bot as in maneuvers through the world. Provisioning a robot spawns an EC2 machine running an AMI that hosts a Gazebo and Turtle sim, which emulates a robot running in a virtual world. As the robot moves throughout the simulation it uses LiDar to be build SLAM mappings of its surrounding environment represented as point clouds. As the robot explores it fills its occupancy grid. This can all be visualized in the rendered world on the main application

## Website

[Visit Main Site](https://ticket2andromeda.github.io/turtlebot-visualizer/)

## Tech Stack

This stack runs 

Threlte.js
Svelte 

And an AWS Serverless backend
