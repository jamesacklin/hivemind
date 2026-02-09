import { OpenRouterResponse, ResponseMessage } from "./types/openrouter.type";
import { ORConversation } from "./types/or-conversation.type";
import env from "@/config";
import { TSchema } from "@sinclair/typebox/type";

const structuredOutputModels = [
  "deepseek/deepseek-chat-v3-0324",
  "google/gemini-2.0-flash-001",
  "google/gemini-2.5-flash-lite-preview-06-17",
  "google/gemini-2.5-flash",
  "openai/gpt-5",
  "openai/gpt-4o-mini",
  "openai/gpt-4.1",
  "openai/gpt-4o",
  "google/gemini-2.5-pro",
  "google/gemini-3-flash-preview"
];

const models = [
  ...structuredOutputModels,
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-sonnet-20240620",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3.7-sonnet",
  "nousresearch/hermes-4-70b",
  "google/gemini-3-flash-preview",
] as const;

const validStructuredOutputModels = new Set(structuredOutputModels);
const validModels = new Set(models);
export type Model = (typeof models)[number];

export type OpenRouterMessengerOptions = {
  models?: Model[];
  maxTokens?: number;
  temperature?: number;
};

const typeboxToJsonSchema = (schema: TSchema): any => {
  const jsonSchema = { ...schema };
  if (jsonSchema.type === "object") {
    jsonSchema.additionalProperties = false;
  }
  if (jsonSchema.properties) {
    for (const key in jsonSchema.properties) {
      jsonSchema.properties[key] = typeboxToJsonSchema(
        jsonSchema.properties[key],
      );
    }
  }
  if (jsonSchema.type === "array" && jsonSchema.items) {
    jsonSchema.items = typeboxToJsonSchema(jsonSchema.items);
  }
  return jsonSchema;
};

const openRouterMessenger = async (
  conversation: ORConversation[],
  {
    models = ["google/gemini-2.5-flash", "deepseek/deepseek-chat-v3-0324"],
    maxTokens = 4096,
    temperature = 1,
  }: OpenRouterMessengerOptions = {},
  responseSchema?: TSchema,
): Promise<ResponseMessage[]> => {
  if (!env.openrouter.apiKey) {
    throw new Error("OpenRouter API key is not set");
  }
  if (!validModels.has(models[0])) {
    throw new Error(`Invalid model: ${models[0]}`);
  }

  let response_format: unknown | undefined = undefined;
  if (responseSchema) {
    if (validStructuredOutputModels.has(models[0])) {
      response_format = {
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: typeboxToJsonSchema(responseSchema),
          strict: true,
        },
      };
    } else {
      conversation.push({
        role: "system" as const,
        content: `Response schema: ${responseSchema}`,
      });
    }
  }

  const requestBody = {
    model: models[0],
    models: models.slice(1),
    messages: conversation,
    temperature,
    max_tokens: maxTokens,
    stream: false,
    reasoning: { exclude: true },
    response_format,
  };

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openrouter.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://flowercomputer.com",
        "X-Title": "Flower Computer Company",
      },
      body: JSON.stringify(requestBody),
    },
  );

  const responseBody = await response.json() as OpenRouterResponse;

  if (!response.ok) {
    throw new Error(
      `OpenRouter API returned status ${response.status}: ${response.statusText}`,
    );
  }

  return responseBody.choices.map((choice) => choice.message);
};

export default openRouterMessenger;
