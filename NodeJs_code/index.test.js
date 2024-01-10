const SmartMeterBilling = require('./index');

describe('SmartMeterBilling', () => {
  let smartMeterBilling;

  beforeEach(() => {
    const peakHoursRate = 10;
    const offPeakHoursRate = 5;

    smartMeterBilling = new SmartMeterBilling(peakHoursRate, offPeakHoursRate);
  });

  test('should calculate total costs for each meter correctly for peak hours and off-peak hours', () => {
    const electricityUsageData = [
      [123456, '2023-10-10T08:00:00', 100],
      [123457, '2023-10-10T03:00:00', 70]
    ];

    smartMeterBilling.processUsageData(electricityUsageData);
    const totalBillAmount = smartMeterBilling.getTotalBillAmount();

    smartMeterBilling.sendSNSMessages();

    expect(totalBillAmount).toEqual({
      123456: 1000, // (10 * 100)
      123457: 350, // (5 * 70)
    });
  });

  test('should handle additional meter data', () => {

    const electricityUsageData = [
      [123456, '2023-10-10T09:00:00', 10],
      [123457, '2023-10-10T05:00:00', 25]
    ];
     smartMeterBilling.processUsageData(electricityUsageData); // 123456: 100 (10*10),  123457: 125 (25*5)

    const electricityUsageData1 = [
      [123456, '2023-10-10T10:00:00', 30],
      [123458, '2023-10-10T06:00:00', 55],
      [123459, '2023-10-10T00:10:00', 25]
    ];
    smartMeterBilling.processUsageData(electricityUsageData1); // 123456: 200 (20*10), 123458: 275 (55*5), 123459: 125 (25*5) 

    const electricityUsageData2 = [
      [123456, '2023-10-10T11:00:00', 90],
      [123459, '2023-10-10T01:10:00', 200],
      [123458, '2023-10-10T07:00:00', 75]
    ];

    smartMeterBilling.processUsageData(electricityUsageData2); // 123456: 600 (60*10) , 123459: 875 (175*5), 123458: 200 (20*10)

    // Calculate total bill amount
    const totalBillAmount = smartMeterBilling.getTotalBillAmount();

    // send SNS messages to each meterId with its total bill amount
    smartMeterBilling.sendSNSMessages();

    expect(totalBillAmount).toEqual({
      123456: 900, // 100 + 200 + 600
      123457: 125, // 125
      123458: 475, // 275 + 200
      123459: 1000,  // 125 + 875
    });
  });
});
