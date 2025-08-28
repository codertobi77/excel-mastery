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

export const toggleLesson = mutation({
  args: { userId: v.id("users"), lessonId: v.id("lessons"), completed: v.boolean() },
  handler: async (ctx, { userId, lessonId, completed }) => {
    const up = await ctx.db.query("userProgress").withIndex("by_user", q => q.eq("userId", userId)).unique();
    if (!up) throw new Error("No user progress");
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_lesson_user", q => q.eq("lessonId", lessonId).eq("progressId", up._id))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { completed, completedAt: completed ? now : undefined });
      return existing._id;
    }
    return await ctx.db.insert("lessonProgress", { lessonId, progressId: up._id, completed, completedAt: completed ? now : undefined });
  },
});

export const savePlacementTest = mutation({
  args: { userId: v.id("users"), level: v.string(), questionsJson: v.string() },
  handler: async (ctx, { userId, level, questionsJson }) => {
    const now = Date.now();
    return await ctx.db.insert("placementTests", { userId, level, questionsJson, createdAt: now });
  },
});

export const getPlacementTest = query({
  args: { userId: v.id("users"), level: v.string() },
  handler: async (ctx, { userId, level }) => {
    return await ctx.db
      .query("placementTests")
      .withIndex("by_user_level", q => q.eq("userId", userId).eq("level", level))
      .order("desc")
      .first();
  },
});

export const savePlacementResult = mutation({
  args: { userId: v.id("users"), level: v.string(), analysis: v.string(), answersJson: v.string() },
  handler: async (ctx, { userId, level, analysis, answersJson }) => {
    const now = Date.now()
    return await ctx.db.insert("placementResults", { userId, level, analysis, answersJson, createdAt: now })
  }
})

export const listPlacementResults = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("placementResults")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .collect()
  }
})

export const upsertPracticeSheet = mutation({
  args: { userId: v.id("users"), name: v.string(), dataJson: v.string(), metaJson: v.string() },
  handler: async (ctx, { userId, name, dataJson, metaJson }) => {
    const now = Date.now()
    const existing = await ctx.db.query("practiceSheets").withIndex("by_user_name", q => q.eq("userId", userId).eq("name", name)).unique()
    if (existing) {
      await ctx.db.patch(existing._id, { dataJson, metaJson, updatedAt: now })
      return existing._id
    }
    return await ctx.db.insert("practiceSheets", { userId, name, dataJson, metaJson, updatedAt: now })
  }
})

export const listPracticeSheets = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.query("practiceSheets").withIndex("by_user", q => q.eq("userId", userId)).order("desc").collect()
  }
})

export const removePracticeSheet = mutation({
  args: { id: v.id("practiceSheets") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
    return true
  }
})


