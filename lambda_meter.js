const AWS = require('aws-sdk');

class SmartMeterBilling {
  constructor(peakHoursRate, offPeakHoursRate) {
    this.peakHoursRate = peakHoursRate;
    this.offPeakHoursRate = offPeakHoursRate;
    this.totalBillAmount = {};
    this.accumulatedReadings = {};
  }

  calculateBillAmount(meterId, timestamp, meterReading) {
    const hour = new Date(timestamp).getHours();
    const billingRate = (hour >= 7 && hour < 24) ? this.peakHoursRate : this.offPeakHoursRate;
    const hourlyUsage = this.accumulatedReadings[meterId] ? meterReading - this.accumulatedReadings[meterId] : meterReading;
    const hourlyCost = billingRate * hourlyUsage;

    if (this.totalBillAmount[meterId]) {
      this.totalBillAmount[meterId] += hourlyCost;
    } else {
      this.totalBillAmount[meterId] = hourlyCost;
    }

    this.accumulatedReadings[meterId] = meterReading;
  }

  processUsageDataBatch(usageData) {
    for (const [meterId, timestamp, meterReading] of usageData) {
      this.calculateBillAmount(meterId, timestamp, meterReading);
    }
  }

  getTotalBillAmount() {
    return this.totalBillAmount;
  }
}

exports.handler = async (event) => {
  try {
    const { peakHoursRate, offPeakHoursRate, usageData } = event;

    const smartMeterBilling = new SmartMeterBilling(peakHoursRate, offPeakHoursRate);

    smartMeterBilling.processUsageDataBatch(usageData);

    // Get total bill amount
    const totalCosts = smartMeterBilling.getTotalBillAmount();
    
    // Simplified AWS SNS service call
    AWS.SNS.SendMessage({ Message: JSON.stringify({ totalCosts }), TopicArn: 'sns-topic-arn' });

    return {
      statusCode: 200,
      body: totalCosts,
    };
  } catch (error) {
    console.error(error);
    throw new Error('Error processing meter data');
  }
 };
