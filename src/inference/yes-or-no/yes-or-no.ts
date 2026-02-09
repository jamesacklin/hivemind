import inference from "../";
import { ORConversation } from "../types";
import { Static, Type } from "@sinclair/typebox";

const yesOrNoSchema = Type.Object({
  answer: Type.Boolean(),
  rationale: Type.String(),
  confidence: Type.Number({ minimum: 0, maximum: 1 }),
});

export type YesOrNo = Static<typeof yesOrNoSchema>;

const yesOrNo = async (
  basePrompt: string,
  conversation: ORConversation[],
): Promise<YesOrNo> => {
  const yesOrNoPrompt = `Please respond with a JSON object containing:
- "answer": true or false, corresponding to "yes" and "no"
- "rationale": your reasoning for this decision
- "confidence": a number between 0 and 1 indicating how confident you are`;

  const prompt: ORConversation[] = [
    {
      role: "system",
      content: basePrompt,
    },
    ...conversation,
    {
      role: "user",
      content: yesOrNoPrompt,
    },
  ];

  const response = await inference(prompt, {
    models: ["google/gemini-3-flash-preview"],
    responseSchema: yesOrNoSchema,
  });
  return response;
};

export default yesOrNo;
