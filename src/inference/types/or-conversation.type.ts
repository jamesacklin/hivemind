import { Static, Type } from "@sinclair/typebox";

export const ORConversationSegmentSchema = Type.Union([
  Type.Object({
    type: Type.Literal("text"),
    text: Type.String(),
  }),
  Type.Object({
    type: Type.Literal("image_url"),
    image_url: Type.Object({
      url: Type.String(),
    }),
  }),
]);

export type ORConversationSegment = Static<typeof ORConversationSegmentSchema>;

export const ORConversationSchema = Type.Object({
  role: Type.Union([
    Type.Literal("user"),
    Type.Literal("assistant"),
    Type.Literal("system"),
    Type.Literal("tool"),
  ]),
  content: Type.Union([Type.String(), Type.Array(ORConversationSegmentSchema)]),
  tool_call_id: Type.Optional(Type.String()),
});

export type ORConversation = Static<typeof ORConversationSchema>;
