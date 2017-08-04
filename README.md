# IoTize
IoTize(.eu) - making IoT accessible to non-nerds

This is the WIP of my masters thesis.

## About
The goal of my thesis is to bring the Internet of Things - accompanied by the constant networking - closer to non tech-savvy people. The access to the IoT will be further facilitated by using low-cost hardware such as the esp8266 chip (on Wemos D1 mini [pro]).

In the proposed solution, a configuration tool, can be used - in combination with the microcontroller and so called "shields" (periphery) - to bring modular and connected sensors online, without any programming skills. The tool generates the necessary code, compiles it, and then flashes the binary to the microcontroller.


## Backend

1. fetch dependencies
>npm     install
2. start app
>node app.js
3. open url in browser (automatic)
> ==[http://127.0.0.1:3000](http://127.0.0.1:3000) ==

## Current Features

### Working Modules
- Relay
- DS18B20 Temperature Sensor
- SHT30
- MicroOLED Display
- WiFi Simple
- Thingspeak
- Volkszaehler

## Planned Features/ToDo

### Planned Modules
- Button
- IFTTT
- MQTT
- HTTP
- WiFi Multi

### Misc
- s



## Documentation and Project Page:

 ==[https://iotize.eu/](https://iotize.eu/) ==