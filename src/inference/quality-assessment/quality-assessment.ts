import inference from "../";
import { ORConversation } from "../types";
import { Static, Type } from "@sinclair/typebox";

const qualityAssessmentSchema = Type.Object({
  score: Type.Number({ minimum: 0, maximum: 100 }),
  rationale: Type.String(),
  accuracy_score: Type.Number({ minimum: 0, maximum: 100 }),
  clarity_score: Type.Number({ minimum: 0, maximum: 100 }),
  actionability_score: Type.Number({ minimum: 0, maximum: 100 }),
});

export type QualityAssessment = Static<typeof qualityAssessmentSchema>;

const qualityAssessment = async (
  basePrompt: string,
  conversation: ORConversation[],
): Promise<QualityAssessment> => {
  const assessmentPrompt = `Please respond with a JSON object containing:
- "score": overall quality score from 0-100 (weighted average of the three dimensions)
- "rationale": brief explanation of the overall quality assessment
- "accuracy_score": 0-100 score for technical accuracy and correctness
- "clarity_score": 0-100 score for clarity, readability, and organization
- "actionability_score": 0-100 score for practical usefulness and implementability

Scoring guidelines:
- 90-100: Exceptional - highly accurate, crystal clear, immediately actionable
- 70-89: Good - accurate and useful with minor improvements possible
- 50-69: Fair - has value but needs significant improvement
- 30-49: Poor - major issues with accuracy, clarity, or usefulness
- 0-29: Very Poor - misleading, unclear, or not actionable`;

  const prompt: ORConversation[] = [
    {
      role: "system",
      content: basePrompt,
    },
    ...conversation,
    {
      role: "user",
      content: assessmentPrompt,
    },
  ];

  const response = await inference(prompt, {
    models: ["google/gemini-3-flash-preview"],
    responseSchema: qualityAssessmentSchema,
  });
  return response;
};

export default qualityAssessment;
