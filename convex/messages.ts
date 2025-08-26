import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const byConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    return await ctx.db.query("messages").withIndex("by_conversation", q => q.eq("conversationId", conversationId)).collect();
  },
});

export const add = mutation({
  args: { conversationId: v.id("conversations"), role: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("messages", { ...args, createdAt: now });
  },
});

export const removeByConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    for (const m of messages) {
      await ctx.db.delete(m._id);
    }
    return true;
  },
});


