#!/bin/bash
mosquitto_pub -t "GPS2/TRACK" -h mqttrv.local -m '{"topic":"GPS/TRACK","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "track":270.0}'
mosquitto_pub -t "GPS2/SPEED" -h mqttrv.local -m '{"topic":"GPS/SPEED","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "speed":61.0}'
mosquitto_pub -t "GPS2" -h mqttrv.local -m '{"topic":"GPS","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "mode":"3D", "latitude":40.021175, "longitude":-105.088102, "altitude":5280.00, "speed":61.0, "track":270.0, "climb":0.0, "GDOP":"EXCELLENT", "HDOP":"EXCELLENT", "VDOP":"EXCELLENT", "distance":0.00}'

sleep 5

mosquitto_pub -t "GPS2" -h mqttrv.local -m '{"topic":"GPS","version":"2.0", "dateTime":"2024-02-29T09:40:27-0700", "mode":"3D", "latitude":41.98291, "longitude":-106.18863, "altitude":5280.00, "speed":61.0, "track":270.0, "climb":0.0, "GDOP":"EXCELLENT", "HDOP":"EXCELLENT", "VDOP":"EXCELLENT", "distance":0.00}'
