import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

function generateCode(length = 6) {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/\W/g, "")
    .substring(0, length);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

async function checkAliasExists(shortCode) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { shortCode },
  });

  const response = await dynamo.send(command);
  return response.Item;
}

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { longURL, customAlias, expiryInDays } = body;

    if (!isValidUrl(longURL)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid URL" }),
      };
    }

    let shortCode = customAlias || generateCode(7);
    let exists = await checkAliasExists(shortCode);

    // Retry logic to ensure unique shortCode
    let retries = 0;
    while (exists && retries < 5) {
      shortCode = generateCode(7);
      exists = await checkAliasExists(shortCode);
      retries++;
    }

    if (exists) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "Unable to generate unique alias after multiple attempts",
        }),
      };
    }

    const timestamp = Date.now();
    const item = {
      shortCode,
      longURL,
      createdAt: timestamp,
      clicks: 0,
      ...(expiryInDays && { expiryAt: timestamp + expiryInDays * 86400000 }),
    };

    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });

    await dynamo.send(putCommand);

    return {
      statusCode: 201,
      body: JSON.stringify({
        shortURL: `https://${event.requestContext.domainName}/${shortCode}`,
        shortCode,
        longURL,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};
