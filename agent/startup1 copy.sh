#!/bin/bash
set -e

# 1. Get UUID from EC2 instance tag
for i in {1..10}; do
  UUID=$(curl -s http://169.254.169.254/latest/meta-data/tags/instance/UUID)
  if [ -n "$UUID" ]; then break; fi
  echo "Waiting for UUID tag..."
  sleep 3
done
# UUID=$(curl -s http://169.254.169.254/latest/meta-data/tags/instance/UUID)

# Sanity check
if [ -z "$UUID" ]; then
  echo "UUID tag not found. Exiting."
  exit 1
fi

DOMAIN="$UUID.ticket2andromeda.com"

# 2. Start virtual display for ROS GUI tools
Xvfb :1 -screen 0 1280x720x24 &
export DISPLAY=:1

# 3. Launch ROS Gazebo simulation and SLAM (in background or tmux/screen)
# export TURTLEBOT3_MODEL=waffle
# source /opt/ros/noetic/setup.bash
# source /home/ubuntu/catkin_ws/devel/setup.bash
# roslaunch turtlebot3_gazebo turtlebot3_world.launch &
# sleep 45
# roslaunch turtlebot3_slam turtlebot3_slam.launch slam_methods:=gmapping open_rviz:=false &

# 4. Install NGINX and Certbot
# sudo apt update
# sudo apt install -y nginx certbot python3-certbot-nginx



# 6. Write the NGINX config dynamically
# Step 1: Create your custom NGINX config
NGINX_CONF_PATH="/etc/nginx/sites-available/default"

sudo tee "$NGINX_CONF_PATH" > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /rosbridge/ {
        proxy_pass http://localhost:9090/;
        proxy_http_version 1.1;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host:\$server_port;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

# Step 2: Run Certbot with nginx installer to inject SSL automatically
sudo certbot --non-interactive --agree-tos --register-unsafely-without-email --nginx -d "$DOMAIN"

# Step 3: Reload NGINX
sudo nginx -t
sudo systemctl reload nginx


# 8. Launch rosbridge with external websocket
# roslaunch rosbridge_server rosbridge_websocket.launch ssl:=false port:=9090 websocket_external_port:=443
