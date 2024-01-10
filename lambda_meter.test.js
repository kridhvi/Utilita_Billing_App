const AWS = require('aws-sdk');
const { handler } = require('./lambda_meter');

jest.mock('aws-sdk');

describe('SmartMeterBilling Lambda Function', () => {
  let mockSendMessage;

  beforeAll(() => {
    // Mock the SNS SendMessage function
    mockSendMessage = jest.fn();
    AWS.SNS = {
      sendMessage: mockSendMessage,
    };
  });

  beforeEach(() => {
    // Clear the mock function calls before each test
    mockSendMessage.mockClear();
  });

  test('should process usage data to calculate total costs and send SNS message', async () => {
    // Mock event data
    const event = {
      peakHoursRate: 10,
      offPeakHoursRate: 5,
      usageData: [
        [123456, '2023-10-10T08:00:00', 100],
        [123457, '2023-10-10T03:00:00', 70],
      ],
    };

    const expectedTotalCosts = {
      123456: 1100,
      123457: 350,
    };

    const result = await handler(event);

    // Test the SNS SendMessage was called
    expect(mockSendMessage).toHaveBeenCalledWith({
      Message: JSON.stringify({ totalCosts: expectedTotalCosts }),
      TopicArn: 'sns-topic-arn',
    });

    // Test the Lambda response
    expect(result).toEqual({
      statusCode: 200,
      body: expectedTotalCosts,
    });
  });
});
