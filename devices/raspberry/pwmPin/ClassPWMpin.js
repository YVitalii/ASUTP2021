const Gpio = require("pigpio").Gpio;

class PWMpin {
  constructor(pinNumber) {
    this.pinNumber = pinNumber;
    this.dutyCycle = 0;
    this.frequency = 1; // 1 Hz for a 1-second period
    this.pwm = new Gpio(this.pinNumber, { mode: Gpio.OUTPUT });
  }

  setDutyCycle(dutyCycle) {
    if (dutyCycle < 0 || dutyCycle > 100) {
      throw new Error("Duty cycle must be between 0 and 100");
    }
    this.dutyCycle = dutyCycle;
    // Convert duty cycle percentage to range 0-255 for pigpio
    const dutyCycleValue = Math.round((dutyCycle / 100) * 255);
    this.pwm.pwmWrite(dutyCycleValue);
  }

  setFrequency(frequency) {
    if (frequency <= 0) {
      throw new Error("Frequency must be greater than 0");
    }
    this.frequency = frequency;
    this.pwm.hardwarePwmWrite(this.frequency, this.dutyCycle * 10000); // pigpio uses a range of 0-1,000,000 for duty cycle
  }

  start() {
    this.setFrequency(this.frequency);
    this.setDutyCycle(this.dutyCycle);
  }

  stop() {
    this.pwm.pwmWrite(0); // Stop PWM signal
  }
}

// Example usage
const pwmPin = new PWMpin(17); // Use GPIO pin 17
pwmPin.setDutyCycle(50); // Set 50% duty cycle
pwmPin.start(); // Start PWM with 1 Hz frequency
