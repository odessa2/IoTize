# IoTize
IoTize(.eu) - a modular IoT application development kit

This application is the result of my masters thesis project.


## About
The goal of my thesis is to bring the Internet of Things - accompanied by the constant networking - closer to non tech-savvy people. The access to the IoT will be further facilitated by using low-cost hardware such as the esp8266 chip (on WEMS D1 mini [Pro]).

In the proposed solution, a configuration tool, can be used - in combination with the microcontroller and so called "shields" (periphery) - to bring modular and connected sensors online, without any programming skills. The tool generates the necessary code, compiles it, and then flashes the binary to the microcontroller.

## Requirement
- Node.js (>v6)
- Arduino IDE 

## Howto

If you don't have them yet, install esp8266 platform package for Arduino, you can get them by executing the following commands:

First, add the new URL to Arduino's board manager
>$ arduino --pref boardsmanager.additional.urls=$(echo $(arduino --get-pref boardsmanager.additional.urls)",http://arduino.esp8266.com/stable/package_esp8266com_index.json") --save-prefs

Then, install the package

>$ arduino --install-boards esp8266:esp8266

## Howto

Get IoTize from git and change directory:

>$ git clone https://github.com/odessa2/IoTize.git && cd IoTize/Backend 

### Download dependencies

Fetch Node.js dependencies:
>$ npm install

Before running for the first time, some additional Arduino libraries have to be installed:

>$ node app.js install-librarys 

### Start the application

>$ node app.js

This should open the UI in your default webbrowser. It can be accessed via this URL: ==[http://127.0.0.1:3000](http://127.0.0.1:3000) ==

## Current Features

### Working Modules
- DS18B20 Temperature Sensor
- SHT30 Temperature and Humidity Sensor
- MicroOLED Display
- Relay
- WiFi Simple + Changeable
- Thingspeak
- Volkszaehler
- Twilio
- MQTT
- DeepSleep

## Planned Features/ToDo
- more automation for making usage of commandline obsolete

### Planned Modules
- 1-Button
- IFTTT
- HTTP
- MicroSD Logging
- WiFi Multi


## Documentation and Project Page:

 ==[https://iotize.eu/](https://iotize.eu/) ==
 
## License
This source-code is released under the ISC License (ISC) 


 