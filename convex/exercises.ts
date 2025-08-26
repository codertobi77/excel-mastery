import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const byCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, { categoryId }) => {
    return await ctx.db.query("exercises").withIndex("by_category", q => q.eq("categoryId", categoryId)).collect();
  },
});

export const create = mutation({
  args: { title: v.string(), description: v.string(), difficulty: v.string(), content: v.string(), solution: v.string(), categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("exercises", { ...args, createdAt: now, updatedAt: now });
  },
});


