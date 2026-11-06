/*
 * VocalisX - ESP32 + AD8232 raw ADC waveform streamer
 *
 * Hardware:
 *   AD8232 3.3V  -> ESP32 3V3
 *   AD8232 GND   -> ESP32 GND
 *   AD8232 OUTPUT-> ESP32 GPIO34
 *
 * Stream format: one JSON line per 250-sample window:
 * {
 *   "type":"vocalisx_data",
 *   "window":1,
 *   "frequency_hz":0.0,
 *   "rms":0.0,
 *   "minimum":0,
 *   "maximum":0,
 *   "average":0.0,
 *   "signal_present":false,
 *   "sample_rate_hz":250,
 *   "samples":[... raw ADC values ...]
 * }
 *
 * IMPORTANT:
 * - Bench-test only. Do not attach body electrodes while the ESP32 is
 *   connected to a computer USB port. This is not a medical device.
 * - Frequency is a simple zero-crossing estimate, not word recognition.
 */

#include <Arduino.h>
#include <math.h>

static constexpr uint8_t SENSOR_PIN = 34;      // ADC1 input-only pin
static constexpr uint16_t SAMPLE_RATE_HZ = 250;
static constexpr uint16_t WINDOW_SIZE = 250;   // one second
static constexpr uint32_t SAMPLE_INTERVAL_US = 1000000UL / SAMPLE_RATE_HZ;

uint16_t samples[WINDOW_SIZE];
uint32_t windowNumber = 0;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetPinAttenuation(SENSOR_PIN, ADC_11db);
  delay(500);
  Serial.println("{\"type\":\"vocalisx_status\",\"status\":\"started\"}");
}

void loop() {
  const uint32_t windowStart = micros();

  for (uint16_t i = 0; i < WINDOW_SIZE; i++) {
    const uint32_t targetTime = windowStart + (uint32_t)i * SAMPLE_INTERVAL_US;
    while ((int32_t)(micros() - targetTime) < 0) {
      // Wait for the next fixed-rate sample slot.
    }
    samples[i] = (uint16_t)analogRead(SENSOR_PIN);
  }

  uint16_t minimum = 4095;
  uint16_t maximum = 0;
  uint32_t sum = 0;

  for (uint16_t i = 0; i < WINDOW_SIZE; i++) {
    const uint16_t value = samples[i];
    if (value < minimum) minimum = value;
    if (value > maximum) maximum = value;
    sum += value;
  }

  const float average = (float)sum / WINDOW_SIZE;
  float squaredSum = 0.0f;
  uint16_t crossings = 0;
  bool previousAbove = samples[0] > average;

  for (uint16_t i = 0; i < WINDOW_SIZE; i++) {
    const float centered = (float)samples[i] - average;
    squaredSum += centered * centered;
    const bool above = samples[i] > average;
    if (above && !previousAbove) crossings++;
    previousAbove = above;
  }

  const float rms = sqrtf(squaredSum / WINDOW_SIZE);
  const float frequencyHz = (float)crossings * SAMPLE_RATE_HZ / WINDOW_SIZE;
  const bool signalPresent = (maximum - minimum) > 5;

  Serial.print("{\"type\":\"vocalisx_data\",\"window\":");
  Serial.print(windowNumber++);
  Serial.print(",\"frequency_hz\":");
  Serial.print(frequencyHz, 2);
  Serial.print(",\"rms\":");
  Serial.print(rms, 2);
  Serial.print(",\"minimum\":");
  Serial.print(minimum);
  Serial.print(",\"maximum\":");
  Serial.print(maximum);
  Serial.print(",\"average\":");
  Serial.print(average, 2);
  Serial.print(",\"signal_present\":");
  Serial.print(signalPresent ? "true" : "false");
  Serial.print(",\"sample_rate_hz\":");
  Serial.print(SAMPLE_RATE_HZ);
  Serial.print(",\"samples\":[");
  for (uint16_t i = 0; i < WINDOW_SIZE; i++) {
    if (i) Serial.print(',');
    Serial.print(samples[i]);
  }
  Serial.println("]}");
}
