import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const upsertLevel = mutation({
  args: { userId: v.id("users"), skillLevel: v.string() },
  handler: async (ctx, { userId, skillLevel }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { skillLevel, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("userProgress", {
      userId,
      skillLevel,
      createdAt: now,
      updatedAt: now,
    });
  },
});


