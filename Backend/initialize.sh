#!/bin/bash

arduino --pref boardsmanager.additional.urls=$(echo $(arduino --get-pref boardsmanager.additional.urls)",http://arduino.esp8266.com/stable/package_esp8266com_index.json") --save-prefs
arduino --install-boards esp8266:esp8266
git clone https://github.com/odessa2/IoTize.git && cd IoTize/Backend  # fetch sourcecode and cd
npm install # fetch node dependencies
node app.js install-librarys # install required iot module libraries