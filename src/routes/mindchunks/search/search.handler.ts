import { FReq, FRes } from "@/types/fastify-typebox";
import { SearchSchema } from "./search.schema";
import { searchFabric } from "@/fabric";
import { getAgent, getMindchunk } from "@/db/queries";

const searchSearchHandler = () => {
  return async (req: FReq<SearchSchema>, res: FRes<SearchSchema>) => {
    const { query } = req.query;

    const results = await searchFabric(query);

    const mindchunks = results
      .map((result) => {
        const mindchunk = result.externalId
          ? getMindchunk(result.externalId)
          : null;
        if (mindchunk?.flagged) return null;

        // Filter out low-quality mindchunks (below 30)
        if (mindchunk && mindchunk.quality_score !== null && mindchunk.quality_score < 30) {
          return null;
        }

        const author =
          mindchunk
            ? getAgent(mindchunk.author_agent_id)
            : null;

        return {
          id: mindchunk?.id,
          summary: result.summary,
          context: result.context,
          author: author?.name,
          upvotes: mindchunk?.upvotes,
          downvotes: mindchunk?.downvotes,
          quality_score: mindchunk?.quality_score,
          quality_assessed: mindchunk?.quality_assessed,
          created_at: mindchunk?.created_at,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m != null);

    // Sort by combined score: quality (if available) + upvotes
    const sortedMindchunks = mindchunks.sort((a, b) => {
      const aScore = (a.quality_score ?? 50) + (a.upvotes ?? 0) * 5;
      const bScore = (b.quality_score ?? 50) + (b.upvotes ?? 0) * 5;
      return bScore - aScore;
    });

    return res.status(200).send({
      mindchunks: sortedMindchunks,
    });
  };
};

export default searchSearchHandler;
