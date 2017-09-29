#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP085_U.h>
#include <PubSubClient.h>
#include <Ticker.h>
WiFiClient client;
String ipAdress;
const char* ssid = "Fritz";
const char* password = "9117625811153179";
const char* wificlienthostname = "espbarom";
String bmp180temperature;
String bmp180pressure;

  Adafruit_BMP085_Unified bmp = Adafruit_BMP085_Unified(10085);

PubSubClient mqttclient(client);

const char* mqtt_server = "server.d9z.de";
const int mqtt_interval = 10;
const int mqtt_port = 1883;
const char * mqtt_node_name = "myespnode";

Ticker mqttTicker;
boolean mqttTrigger = true;


void triggerMqtt() {
	mqttTrigger = true;
}



void reconnect() {
	// Loop until we're reconnected
	while (!mqttclient.connected()) {
		Serial.print("Attempting MQTT connection...");
		// Attempt to connect
		if (mqttclient.connect(mqtt_node_name)) {
			Serial.println("connected");
			// Once connected, publish an announcement...
			mqttclient.publish("outTopic", "hello world");

		} else {
			Serial.print("failed, rc=");
			Serial.print(mqttclient.state());
			Serial.println(" try again in 5 seconds");
			// Wait 5 seconds before retrying
			delay(5000);
		}
	}
}

void publishValue(String topic, String value){
	
	Serial.println("Publish Topic: " + String(topic));
	Serial.println("Publish Value: " + String(value));
	mqttclient.publish(topic.c_str(),value.c_str());
}

void setup(){
	delay(10);WiFi.hostname(wificlienthostname);WiFi.mode(WIFI_STA);
	WiFi.begin(ssid, password);
	while (WiFi.status() != WL_CONNECTED) {delay(500);}
	ipAdress=WiFi.localIP().toString();
	if (!MDNS.begin(wificlienthostname))
	Serial.println("Error setting up MDNS responder!");
	/* Initialise the sensor */
	if(!bmp.begin())
		{
		/* There was a problem detecting the BMP085 ... check your connections */
		Serial.print("Ooops, no BMP085 detected ... Check your wiring or I2C ADDR!");
		while(1);
	}
	mqttclient.setServer(mqtt_server,  mqtt_port);
	mqttTicker.attach(mqtt_interval, triggerMqtt);

}
void loop(){
	sensors_event_t event;
	bmp.getEvent(&event);
	/* Display the results (barometric pressure is measure in hPa) */
	if (event.pressure)
	{
		/* Display atmospheric pressue in hPa */
		Serial.print("Pressure:    ");
		Serial.print(event.pressure);
		Serial.println(" hPa");

		float temperature; 
		bmp.getTemperature(&temperature);
		Serial.print("Temperature: ");
		Serial.print(temperature);
		Serial.println(" C");
		bmp180temperature=temperature;
		bmp180pressure=event.pressure;
	}
	delay(1000);	if (!mqttclient.connected()) {
		reconnect();
	}
	mqttclient.loop();
	if (mqttTrigger){
		publishValue("/d9z/t",bmp180temperature);
		delay(100);
		publishValue("/d9z/p",bmp180pressure);
		delay(100);
		mqttTrigger=false;
	}

}
