import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const byCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    return await ctx.db.query("chapters").withIndex("by_course_order", q => q.eq("courseId", courseId)).collect();
  },
});

export const create = mutation({
  args: { courseId: v.id("courses"), title: v.string(), order: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chapters", args);
  },
});


