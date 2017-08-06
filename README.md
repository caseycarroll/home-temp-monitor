# home-temp-monitor
A website that allows me to monitor the climate conditions of my home. Let's me know if my cat is comfortable.

## About
I've set up a Raspberry Pi 2 with a DMT22 Humidty/Temp sensor in my living room. A cron job runs every half hour to execute a python script that takes a reading from the sensor and stores it into a simple mysql database. The webserver, written in golang, does two main things:
1. Serves up a template that displays the latest reading
2. Sends over a JSON object of readings from the past 24 hours

A custom web component fetches the JSON from the server and displays it in a bar graph. The bar graph is an svg that responsively changes size depending on the size of the browser window. Unfortunately, the graph only changes size upon reload. There are plans to make it change more responsively (when the window is resized or a handheld device is rotated)
