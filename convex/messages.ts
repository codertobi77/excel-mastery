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

export const update = mutation({
  args: { id: v.id("messages"), content: v.string() },
  handler: async (ctx, { id, content }) => {
    return await ctx.db.patch(id, { content });
  },
});

export const remove = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return true;
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

export const removeAfter = mutation({
  args: { conversationId: v.id("conversations"), cutoffCreatedAt: v.number() },
  handler: async (ctx, { conversationId, cutoffCreatedAt }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    for (const m of messages) {
      if (m.createdAt > cutoffCreatedAt) {
        await ctx.db.delete(m._id);
      }
    }
    return true;
  },
});


