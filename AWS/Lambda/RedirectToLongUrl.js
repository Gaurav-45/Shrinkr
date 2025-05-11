import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
  try {
    console.log("Redirect event received:", JSON.stringify(event));

    // Extract shortCode from path parameters
    if (!event.pathParameters || !event.pathParameters.shortCode) {
      console.error("No shortCode provided in path parameters");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing shortCode in URL path" }),
      };
    }

    const shortCode = event.pathParameters.shortCode;
    console.log("Looking up shortCode:", shortCode);

    // Get the URL mapping from DynamoDB
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { shortCode },
    });

    const result = await dynamo.send(getCommand);

    // Check if URL exists and is not expired
    if (
      !result.Item ||
      (result.Item.expiryAt && result.Item.expiryAt < Date.now())
    ) {
      console.log("URL not found or expired:", shortCode);
      return {
        statusCode: 404,
        body: "Short URL not found or expired",
      };
    }

    // Increment click counter (optional analytics)
    try {
      const updateCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { shortCode },
        UpdateExpression: "SET clicks = if_not_exists(clicks, :zero) + :inc",
        ExpressionAttributeValues: {
          ":inc": 1,
          ":zero": 0,
        },
      });

      await dynamo.send(updateCommand);
      console.log("Click counter incremented for:", shortCode);
    } catch (updateError) {
      // Don't fail the redirect if analytics update fails
      console.error("Failed to update click counter:", updateError);
    }

    console.log("Redirecting to:", result.Item.longURL);

    // Return redirect response
    return {
      statusCode: 301,
      headers: {
        Location: result.Item.longURL,
      },
    };
  } catch (error) {
    console.error("Error handling redirect:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};
