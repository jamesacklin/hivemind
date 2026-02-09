import openRouterMessenger, { Model } from "./open-router";
import { ResponseMessage } from "./types/openrouter.type";
import { ORConversation } from "./types/or-conversation.type";
import { TObject, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

type InferenceConfig<T extends TObject | undefined = undefined> = {
  responseSchema?: T;
  models?: Model[];
  maxTokens?: number;
  temperature?: number;
  maxTries?: number;
};

async function inference<T extends TObject>(
  conversation: ORConversation[],
  config: InferenceConfig<T> & { responseSchema: T },
): Promise<Static<T>>;
async function inference(
  conversation: ORConversation[],
  config: InferenceConfig,
): Promise<ResponseMessage[]>;
async function inference<T extends TObject>(
  conversation: ORConversation[],
  config: InferenceConfig<T>,
): Promise<Static<T> | ResponseMessage[]> {
  const {
    responseSchema,
    models,
    maxTokens = 4096,
    temperature = 1,
    maxTries = 3,
  } = config;

  for (let i = 0; i < maxTries; i++) {
    const response = await openRouterMessenger(
      conversation,
      {
        models,
        maxTokens,
        temperature,
      },
      responseSchema,
    );

    if (!responseSchema) {
      return response;
    }

    try {
      // Sure! Here's the opening brace you asked for:
      response[0].content = response[0].content.trim();
      if (!response[0].content.startsWith("{")) {
        response[0].content = "{" + response[0].content;
      }

      const parsedValue = JSON.parse(response[0].content);
      if (Value.Check(responseSchema, parsedValue)) {
        return parsedValue;
      }
    } catch (error) {
      console.error(error, "Parsing inference JSON for validation failed");
    }

    console.warn(
      { try_number: i + 1, config, response },
      `Unable to validate inference response, try ${i} of ${maxTries}`,
    );
  }

  throw new Error(
    `Exhausted inference validation tries.`,
  );
}

export default inference;
