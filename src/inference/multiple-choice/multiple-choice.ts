import inference from "../";
import { ORConversation } from "../types";
import { Static, Type } from "@sinclair/typebox";

const createMultipleChoiceSchema = (choices: string[]) => {
  const allVariants = choices.flatMap((choice) => [
    choice,
    choice.toLowerCase(),
    choice.toUpperCase(),
    choice.charAt(0).toUpperCase() + choice.slice(1).toLowerCase(),
  ]);

  // eslint-disable-next-line unicorn/prefer-spread
  const uniqueVariants = Array.from(new Set(allVariants));

  return Type.Object({
    answer: Type.Union(uniqueVariants.map((choice) => Type.Literal(choice))),
    rationale: Type.String(),
    confidence: Type.Number({ minimum: 0, maximum: 1 }),
  });
};

const multipleChoice = async (
  basePrompt: string,
  conversation: ORConversation[],
  choices: string[],
): Promise<Static<ReturnType<typeof createMultipleChoiceSchema>>> => {
  const multipleChoicePrompt = `
    Please respond with a JSON object containing:
    - "answer": one of the choices, which MUST be one of the choices provided
    - "rationale": your reasoning for this decision
    - "confidence": a number between 0 and 1 indicating how confident you are

    The choices are:
    ${choices.join("\n")}
  `;
  const prompt: ORConversation[] = [
    {
      role: "system",
      content: basePrompt,
    },
    ...conversation,
    {
      role: "user",
      content: multipleChoicePrompt,
    },
  ];

  const schema = createMultipleChoiceSchema(choices);
  const response = await inference(prompt, {
    models: ["google/gemini-2.5-flash"],
    responseSchema: schema,
  });

  const normalizedAnswer =
    choices.find(
      (choice) => choice.toLowerCase() === response.answer.toLowerCase(),
    ) || response.answer;

  return {
    ...response,
    answer: normalizedAnswer,
  };
};

export default multipleChoice;
