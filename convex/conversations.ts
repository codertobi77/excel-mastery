import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const conversations = await ctx.db.query("conversations").withIndex("by_user", q => q.eq("userId", userId)).collect();
    // Sort by createdAt descending (newest first)
    return conversations.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: { userId: v.id("users"), title: v.string() },
  handler: async (ctx, { userId, title }) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", { userId, title, createdAt: now, updatedAt: now });
  },
});

export const update = mutation({
  args: { id: v.id("conversations"), title: v.string() },
  handler: async (ctx, { id, title }) => {
    const now = Date.now();
    return await ctx.db.patch(id, { title, updatedAt: now });
  },
});

export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, { id }) => {
    // Supprimer d'abord tous les messages de la conversation (via mutation dédiée)
    await ctx.runMutation(api.messages.removeByConversation, { conversationId: id });
    // Puis supprimer la conversation
    return await ctx.db.delete(id);
  },
});

export const removeIfEmpty = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, { id }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", id))
      .collect();
    if (messages.length === 0) {
      await ctx.db.delete(id);
      return true;
    }
    return false;
  },
});


