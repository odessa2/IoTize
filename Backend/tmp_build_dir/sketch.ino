#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <OneWire.h>
#include <PubSubClient.h>
#include <Ticker.h>
WiFiClient client;String ipAdress;
const char* ssid   = "Fritz";
const char* password = "9117625811153179";
const char* wificlienthostname = "myBedroomHeater";

OneWire  ds(D2);
String DS18B20Temp;

PubSubClient mqttclient(client);

const char* mqtt_server = "server.d9z.de";
const int mqtt_interval = 120;
const int mqtt_port = 1883;
const char * mqtt_node_name = "espthermo";

Ticker mqttTicker;
boolean mqttTrigger = true;
const int relais = D1;
const int mode = 1;
String trigger = "22";
int state = 0;



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

 
	}float toFloat(String s){
	return s.toFloat();
}
void switchRelais(float compareValue){
if(mode==0){
	if(compareValue>toFloat(trigger)){
	digitalWrite(relais,HIGH);
	state=1;
	}else{
		digitalWrite(relais,LOW);
		state=0;
	}
}
if(mode==1){
	if(compareValue<toFloat(trigger)){
		digitalWrite(relais,HIGH);
		state=1;
		}else{
			digitalWrite(relais,LOW);
			state=0;
		}
	}
}
void setup(){
	delay(10);WiFi.hostname(wificlienthostname);WiFi.mode(WIFI_STA);
WiFi.begin(ssid, password);
	while (WiFi.status() != WL_CONNECTED) {delay(500);}
	ipAdress=WiFi.localIP().toString();
	if (!MDNS.begin(wificlienthostname))
	Serial.println("Error setting up MDNS responder!");
		mqttclient.setServer(mqtt_server,  mqtt_port);
	mqttTicker.attach(mqtt_interval, triggerMqtt)
;pinMode(relais,OUTPUT);
}
void loop(){
byte i; byte present = 0; 
	byte type_s; byte data[12];
	byte addr[8]; 
	    if ( !ds.search(addr)) {
		ds.reset_search();
		delay(250);
		return;
		}type_s = 0;
	ds.reset();ds.select(addr);ds.write(0x44, 1);    
	   delay(1000); 
	present = ds.reset(); 
	ds.select(addr); ds.write(0xBE);
	      for ( i = 0; i < 9; i++) {
		        data[i] = ds.read();
	}
		int16_t raw = (data[1] << 8) | data[0];
		if (type_s) {
			raw = raw << 3;
			 if (data[7] == 0x10) {
				 raw = (raw & 0xFFF0) + 12 - data[6]; 
			}
		} else { 
		byte cfg = (data[4] & 0x60);
		if (cfg == 0x00) raw = raw & ~7;  
		else if (cfg == 0x20) raw = raw & ~3;
		else if (cfg == 0x40) raw = raw & ~1;
		}
		DS18B20Temp = (float)raw / 16.0; 
		if (!mqttclient.connected()) {
	reconnect();
	}
	mqttclient.loop();	if (mqttTrigger){
		publishValue("/d9z/bedroom/temp",DS18B20Temp);
		delay(100);
		 mqttTrigger=false;
	}
	switchRelais(toFloat(DS18B20Temp));
	
	
}
