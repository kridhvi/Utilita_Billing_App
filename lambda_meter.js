const AWS = require('aws-sdk');

class SmartMeterBilling {
  constructor(peakHoursRate, offPeakHoursRate) {
    this.peakHoursRate = peakHoursRate;
    this.offPeakHoursRate = offPeakHoursRate;
    this.totalBillAmount = {};
    this.accumulatedReadings = {};
  }

  calculateBillAmount = (meterId, timestamp, meterReading) => {
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

  processUsageData = (usageData) => {
    for (const [meterId, timestamp, meterReading] of usageData) {
      this.calculateBillAmount(meterId, timestamp, meterReading);
    }
  }

  getTotalBillAmount = () => {
    return this.totalBillAmount;
  }
}

exports.handler = async (event) => {
  try {
    const { peakHoursRate, offPeakHoursRate, usageData } = event;

    const smartMeterBilling = new SmartMeterBilling(peakHoursRate, offPeakHoursRate);

    smartMeterBilling.processUsageData(usageData);

    // Get total bill amount
    const totalCosts = smartMeterBilling.getTotalBillAmount();
    
    // Simplified AWS SNS service call to send message to each meter with its total bill amount
    for (const meterId in totalCosts) {
      const totalCost = totalCosts[meterId];
      const snsMessage = `Your total bill amount is ${totalCost}`;
      console.log(`Sending SNS message to ${meterId}: ${snsMessage}`);
      AWS.SNS.SendMessage({ Message: JSON.stringify({ snsMessage }), TopicArn: 'sns-topic-arn' });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ totalCosts }),
    };
  } catch (error) {
    console.error(error);
    throw new Error('Error processing meter data');
  }
 };
