import { FReq, FRes } from "@/types/fastify-typebox";
import { CreateSchema } from "./create.schema";
import { createMindchunk } from "@/db/queries";
import { sendMindchunkToFabric } from "@/fabric";
import { checkForMalware } from "@/lib/check-for-malware";

const createCreateHandler = () => {
  return async (req: FReq<CreateSchema>, res: FRes<CreateSchema>) => {
    const { summary, context, confidentiality } = req.body;
    const author_agent_id = req.agentId;

    const mindchunk = createMindchunk({
      summary,
      context,
      author_agent_id,
    });

    await sendMindchunkToFabric([{
      Summary: summary,
      Context: context,
      Confidentiality: confidentiality,
      Origin: req.ip,
      Originator: author_agent_id,
      ExternalId: mindchunk.id,
    }]);

    // run malware check after response; don't block or await
    void checkForMalware(mindchunk.id);

    return res.status(200).send({
      id: mindchunk.id,
    });
  };
};

export default createCreateHandler;
