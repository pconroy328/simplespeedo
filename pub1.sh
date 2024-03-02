#!/bin/bash
mosquitto_pub -t "GPS2/TRACK" -h gx100.local -m '{"topic":"GPS/TRACK","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "track":270.0}'
mosquitto_pub -t "GPS2/SPEED" -h gx100.local -m '{"topic":"GPS/SPEED","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "speed":61.0}'
mosquitto_pub -t "GPS2" -h gx100.local -m '{"topic":"GPS","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "mode":"Initializing", "latitude":40.000000, "longitude":-105.000000, "altitude":5280.00, "speed":61.0, "track":270.0, "climb":0.0, "GDOP":"EXCELLENT", "HDOP":"EXCELLENT", "VDOP":"EXCELLENT", "distance":0.00}'
