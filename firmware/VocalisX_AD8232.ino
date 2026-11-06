#include <Arduino.h>
#include <math.h>

// VocalisX raw ADC waveform streamer for ESP32 + AD8232.
// AD8232: 3.3V -> ESP32 3V3, GND -> GND, OUTPUT -> GPIO34.
// Bench testing only. Do not attach body electrodes while USB-connected to a computer.

static constexpr uint8_t SENSOR_PIN = 34;
static constexpr uint16_t SAMPLE_RATE_HZ = 250;
static constexpr uint16_t WINDOW_SIZE = 250;
static constexpr uint32_t SAMPLE_INTERVAL_US = 1000000UL / SAMPLE_RATE_HZ;
uint16_t samples[WINDOW_SIZE];
uint32_t windowNumber = 0;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetPinAttenuation(SENSOR_PIN, ADC_11db);
  delay(500);
  Serial.println("{\\"type\\":\\"vocalisx_status\\",\\"status\\":\\"started\\"}");
}

void loop() {
  const uint32_t startUs = micros();
  for (uint16_t i = 0; i < WINDOW_SIZE; i++) {
    const uint32_t targetUs = startUs + (uint32_t)i * SAMPLE_INTERVAL_US;
    while ((int32_t)(micros() - targetUs) < 0) {}
    samples[i] = (uint16_t)analogRead(SENSOR_PIN);
  }

  uint16_t minimum = 4095, maximum = 0;
  uint32_t sum = 0;
  for (uint16_t i = 0; i < WINDOW_SIZE; i++) {
    minimum = min(minimum, samples[i]);
    maximum = max(maximum, samples[i]);
    sum += samples[i];
  }
  const float average = (float)sum / WINDOW_SIZE;
  float squareSum = 0.0f;
  uint16_t risingCrossings = 0;
  bool previousAbove = samples[0] > average;
  for (uint16_t i = 0; i < WINDOW_SIZE; i++) {
    const float centered = (float)samples[i] - average;
    squareSum += centered * centered;
    const bool above = samples[i] > average;
    if (above && !previousAbove) risingCrossings++;
    previousAbove = above;
  }
  const float rms = sqrtf(squareSum / WINDOW_SIZE);
  const float frequencyHz = (float)risingCrossings * SAMPLE_RATE_HZ / WINDOW_SIZE;
  const bool signalPresent = (maximum - minimum) > 5;

  Serial.print("{\\"type\\":\\"vocalisx_data\\",\\"window\\":"); Serial.print(windowNumber++);
  Serial.print(",\\"frequency_hz\\":"); Serial.print(frequencyHz, 2);
  Serial.print(",\\"rms\\":"); Serial.print(rms, 2);
  Serial.print(",\\"minimum\\":"); Serial.print(minimum);
  Serial.print(",\\"maximum\\":"); Serial.print(maximum);
  Serial.print(",\\"average\\":"); Serial.print(average, 2);
  Serial.print(",\\"signal_present\\":"); Serial.print(signalPresent ? "true" : "false");
  Serial.print(",\\"sample_rate_hz\\":"); Serial.print(SAMPLE_RATE_HZ);
  Serial.print(",\\"samples\\":[");
  for (uint16_t i = 0; i < WINDOW_SIZE; i++) { if (i) Serial.print(','); Serial.print(samples[i]); }
  Serial.println("]}");
}
