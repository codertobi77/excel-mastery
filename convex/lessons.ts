import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const byChapter = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, { chapterId }) => {
    return await ctx.db.query("lessons").withIndex("by_chapter_order", q => q.eq("chapterId", chapterId)).collect();
  },
});

export const create = mutation({
  args: { chapterId: v.id("chapters"), title: v.string(), content: v.string(), order: v.number(), duration: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lessons", args);
  },
});


