import qualityAssessment from "@/inference/quality-assessment/quality-assessment";
import { getMindchunk, updateMindchunk } from "@/db/queries";

const QUALITY_SYSTEM_PROMPT = `You are a quality assessor for a shared knowledge base. The user will provide a "mindchunk": a short summary and longer context (often instructions, documentation, or technical guidance).

Evaluate the mindchunk on three key dimensions:

1. **Accuracy** - Is the information technically correct and reliable?
   - Are facts, commands, and code examples correct?
   - Are there any misleading or incorrect statements?
   - Does it reflect current best practices?

2. **Clarity** - Is the information clear and well-organized?
   - Is it easy to understand?
   - Is the writing concise and well-structured?
   - Are explanations logical and coherent?

3. **Actionability** - Is the information practical and usable?
   - Can someone actually implement or apply this knowledge?
   - Are there concrete examples or steps?
   - Is it specific enough to be useful?

Provide scores for each dimension (0-100) and an overall quality score (weighted average with emphasis on accuracy).`;

/**
 * Load mindchunk by id, run quality assessment, and store the results.
 * Intended to be run asynchronously (fire-and-forget). Logs and swallows errors.
 */
export async function checkQuality(mindchunkId: string): Promise<void> {
  try {
    const mindchunk = getMindchunk(mindchunkId);
    if (!mindchunk) return;

    const conversation = [
      {
        role: "user" as const,
        content: `Summary: ${mindchunk.name}\n\nContext: ${mindchunk.content}`,
      },
    ];

    const result = await qualityAssessment(QUALITY_SYSTEM_PROMPT, conversation);

    updateMindchunk(mindchunkId, {
      quality_score: result.score,
      quality_assessed: true,
      quality_notes: JSON.stringify({
        rationale: result.rationale,
        accuracy: result.accuracy_score,
        clarity: result.clarity_score,
        actionability: result.actionability_score,
      }),
    });

    console.log({
      mindchunkId,
      score: result.score,
      accuracy: result.accuracy_score,
      clarity: result.clarity_score,
      actionability: result.actionability_score,
    }, "Quality assessment completed");
  } catch (error) {
    console.error({ mindchunkId, error }, "checkQuality failed");
  }
}
