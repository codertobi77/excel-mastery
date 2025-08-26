import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.query("userProgress").withIndex("by_user", q => q.eq("userId", userId)).unique();
  },
});

export const markLesson = mutation({
  args: { progressId: v.id("userProgress"), lessonId: v.id("lessons"), completed: v.boolean() },
  handler: async (ctx, { progressId, lessonId, completed }) => {
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_lesson_user", q => q.eq("lessonId", lessonId).eq("progressId", progressId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { completed, completedAt: completed ? now : undefined });
      return existing._id;
    }
    return await ctx.db.insert("lessonProgress", { progressId, lessonId, completed, completedAt: completed ? now : undefined });
  },
});

export const markExercise = mutation({
  args: { progressId: v.id("userProgress"), exerciseId: v.id("exercises"), completed: v.boolean(), score: v.optional(v.number()) },
  handler: async (ctx, { progressId, exerciseId, completed, score }) => {
    const existing = await ctx.db
      .query("exerciseProgress")
      .withIndex("by_exercise_user", q => q.eq("exerciseId", exerciseId).eq("progressId", progressId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { completed, score, completedAt: completed ? now : undefined });
      return existing._id;
    }
    return await ctx.db.insert("exerciseProgress", { progressId, exerciseId, completed, score, completedAt: completed ? now : undefined });
  },
});


