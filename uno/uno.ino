// Esp8266
#include "WiFiEsp.h"
#define CH_PD 9 //sinal de controle de CH_PD
#define RST 8 //sinal de controle de RST
#ifndef HAVE_HWSERIAL1
#include "SoftwareSerial.h"
SoftwareSerial Serial1(3, 4); // RX, TX
#endif

// Módulo Rele
#define RELE 10

// Sensor de Corrente
#define ACSPin A0
#define VQ 509

// Sensor Temperatura
#include "DHT.h"
#define DHTPIN A4 // pino temperatura 
#define DHTTYPE DHT11 // DHT 11
DHT dht(DHTPIN, DHTTYPE);

char ssid[] = "GVT";
char pass[] = "17151715";
int status = WL_IDLE_STATUS;

WiFiEspServer server(80);
RingBuffer buf(8);
int releStatus = HIGH;
void setup()
{
  initESP8266();
  initRele();
  Serial.begin(9600);   // initialize serial for debugging
  Serial1.begin(9600);    // initialize serial for ESP module
  WiFi.init(&Serial1);    // initialize ESP module

  // check for the presence of the shield
  if (WiFi.status() == WL_NO_SHIELD) {
    Serial.println("Fail Startup ESP8266");
    while (true);
  }
  // try connect to SSID
  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to WPA SSID: ");
    Serial.println(ssid);
    status = WiFi.begin(ssid, pass);
  }
  dht.begin();
  server.begin();
}

void getTempHum(float *temp,float *hum) {
  *temp = dht.readTemperature();
  *hum = dht.readHumidity();
  // testa se retorno é valido, caso contrário algo está errado.
  if (isnan(*temp) || isnan(*hum)) {
    *temp = -1;
    *hum = -1;
    
  }
}

float readCurrent() {
  int current = 0;
  int sensitivity = 66;//change this to 100 for ACS712-20A or to 66 for ACS712-30A
  //read 5 samples to stabilise value
  for (int i = 0; i < 200; i++) {
    current += abs(analogRead(ACSPin) - VQ);
    delay(1);
  }
  current = map(current / 200, 0, 1023, 0, 5000);
  return float(current) / sensitivity;
}


void loop()
{
  WiFiEspClient client = server.available();  // listen for incoming clients
  if (client) {                               // if you get a client,
    buf.init();                               // initialize the circular buffer
    while (client.connected()) {              // loop while the client's connected
      if (client.available()) {               // if there's bytes to read from the client,
        char c = client.read();               // read a byte, then
        buf.push(c);                          // push it to the ring buffer

        // printing the stream to the serial monitor will slow down
        // the receiving of data from the ESP filling the serial buffer
        //Serial.write(c);
        // that's the end of the HTTP request, so send a response
        if (buf.endsWith("\r\n\r\n")) {
          sendHttpResponse(client);
          break;
        }

        // Check to see if the client request was "GET /H" or "GET /L":
        if (buf.endsWith("GET /L") || buf.endsWith("GET /l")) {
          releStatus = LOW;
          digitalWrite(RELE, LOW);
        }
        else if (buf.endsWith("GET /H") || buf.endsWith("GET /h")) {
          releStatus = HIGH;
          digitalWrite(RELE, HIGH);
        }
      }
    }

    // close the connection
    client.stop();
    Serial.println("Client disconnected");
  }
}


void sendHttpResponse(WiFiEspClient client)
{
  bool lightON = false;
  if (readCurrent() > 0.12) {
    lightON = true;
  }
  float temp = -1;
  float hum = -1;
  getTempHum(&temp ,&hum);

  // HTTP headers always start with a response code (e.g. HTTP/1.1 200 OK)
  // and a content-type so the client knows what's coming, then a blank line:
  client.println("HTTP/1.1 200 OK");
  client.println("Content-type:text/html");
  client.println("Access-Control-Allow-Origin: *");
  client.println();

  // the content of the HTTP response follows the header:
  client.print("[{\"currentReleState\":");
  client.print(releStatus);
  client.print(",\"currentLightState\":");
  client.print(lightON);
  client.print(",\"currentTemp\":");
  client.print(temp);
  client.print(",\"currentUmi\":");
  client.print(hum);
  client.print("}]");
  client.println();
}

void initRele() {
  pinMode(RELE, OUTPUT);
  digitalWrite(RELE, HIGH);
}

void initESP8266() {
  pinMode(CH_PD, OUTPUT);
  pinMode(RST, OUTPUT);
  digitalWrite(CH_PD, HIGH); //Setado em alto - funcionamento normal
  digitalWrite(RST, HIGH); //RST em alto - funcionamento normal
  digitalWrite(RST, LOW); //RST em alto - funcionamento normal
  digitalWrite(RST, HIGH); //RST em alto - funcionamento normal
}

