#!/bin/bash
mosquitto_pub -t "GPS" -h gx100.local -m '{"topic":"GPS/SPEED","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "speed":62.0 }'
sleep 1
mosquitto_pub -t "GPS" -h gx100.local -m '{"topic":"GPS/SPEED","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "speed":58.0 }'
sleep 1
mosquitto_pub -t "GPS" -h gx100.local -m '{"topic":"GPS/SPEED","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "speed":30.0 }'
sleep 1
mosquitto_pub -t "GPS" -h gx100.local -m '{"topic":"GPS/SPEED","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "speed":10.0 }'
sleep 1
mosquitto_pub -t "GPS" -h gx100.local -m '{"topic":"GPS/SPEED","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "speed":2.0 }'
sleep 1
mosquitto_pub -t "GPS" -h gx100.local -m '{"topic":"GPS/SPEED","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "speed":5.0 }'
sleep 1
mosquitto_pub -t "GPS" -h gx100.local -m '{"topic":"GPS/SPEED","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "speed":10.0 }'
sleep 1
mosquitto_pub -t "GPS" -h gx100.local -m '{"topic":"GPS/SPEED","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "speed":28.0 }'
