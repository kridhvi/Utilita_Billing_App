class SmartMeterBilling {
  constructor(peakHoursRate, offPeakHoursRate) {
    this.peakHoursRate = peakHoursRate;
    this.offPeakHoursRate = offPeakHoursRate;
    this.accumulatedReadings = {};
    this.totalBillAmount = {};
  }

  calculateBillAmount = (meterId, timestamp, meterReading) => {
    const hour = new Date(timestamp).getHours();
    const billingRate = hour >= 7 && hour < 24 ? this.peakHoursRate : this.offPeakHoursRate;

    //Current Usuage = Previous meter reading - current meter reading
    const hourlyUsage = this.accumulatedReadings[meterId] ? meterReading - this.accumulatedReadings[meterId] : meterReading;
    const hourlyCost = billingRate * hourlyUsage;

    // Accumulate the cost for this meter
    if (this.totalBillAmount[meterId]) {
      this.totalBillAmount[meterId] += hourlyCost;
    } else {
      this.totalBillAmount[meterId] = hourlyCost;
    }

    this.accumulatedReadings[meterId] = meterReading;
  }

  processUsageData = (electricityUsageData) => {
    for (const [meterId, timestamp, meterReading] of electricityUsageData) {
      this.calculateBillAmount(meterId, timestamp, meterReading);
    }
  }

  getTotalBillAmount = () => {
    console.log(this.totalBillAmount);
    return this.totalBillAmount;
  }

  // Send SNS messages for each meter in totalBillAmount
  sendSNSMessages = () => {
    for (const meterId in this.totalBillAmount) {
      const totalCost = this.totalBillAmount[meterId];
      const snsMessage = `Your total bill amount is ${totalCost}`;
      console.log(`Sending SNS message to ${meterId}: ${snsMessage}`);
    }
  };

};

module.exports = SmartMeterBilling;