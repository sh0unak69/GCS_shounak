#include <XBee.h>
#include <AltSoftSerial.h>

AltSoftSerial xbeeSerial;  // RX=8, TX=9
XBee xbee;

// Define your 64-bit destination here at global scope
uint8_t dest64[] = { 
  0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0x2C, 0x7F 
};

void setup() {
  Serial.begin(9600);
  while (!Serial);            // wait for USB-Serial on some boards
  xbeeSerial.begin(9600);
  xbee.setSerial(xbeeSerial);

  Serial.println(F("=== XBee Ready ==="));
  Serial.println(F("Waiting for commands..."));
}

void loop() {
  // Forward any data from XBee to Serial
  while (xbeeSerial.available()) {
    char c = xbeeSerial.read();
    Serial.write(c);
  }

  // Read commands from Serial Monitor
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();  // Remove whitespace and newlines
    
    if (command.length() > 0) {
      // Verify command format: CMD,3101,<COMMAND>,<ARGUMENT>
      if (command.startsWith("CMD,3101,")) {
        // Send command to XBee
        Tx64Request txReq(dest64, (uint8_t*)command.c_str(), command.length());
        txReq.setFrameId(0x01);  // request status ACK
        xbee.send(txReq);

        // Wait for TX Status and print result
        xbee.readPacket(200);
        if (xbee.getResponse().getApiId() == TX_STATUS_RESPONSE) {
          TxStatusResponse stat;
          xbee.getResponse().getTxStatusResponse(stat);
          if (stat.getStatus() == SUCCESS) {
            Serial.println(command);  // Echo the command back
          } else {
            Serial.println("Error sending command");
          }
        }
      } else {
        Serial.println("Invalid command format. Expected: CMD,3101,<COMMAND>,<ARGUMENT>");
      }
    }
  }
}

