import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    level: v.string(),
    duration: v.number(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("courses", {
      title: args.title,
      description: args.description,
      level: args.level,
      duration: args.duration,
      imageUrl: args.imageUrl,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createFullCourse = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    level: v.string(),
    duration: v.number(),
    imageUrl: v.optional(v.string()),
    chapters: v.array(
      v.object({
        title: v.string(),
        order: v.number(),
        lessons: v.array(
          v.object({
            title: v.string(),
            content: v.string(),
            order: v.number(),
            duration: v.number(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const courseId = await ctx.db.insert("courses", {
      title: args.title,
      description: args.description,
      level: args.level,
      duration: args.duration,
      imageUrl: args.imageUrl,
      createdAt: now,
      updatedAt: now,
    });

    for (const ch of args.chapters) {
      const chapterId = await ctx.db.insert("chapters", {
        title: ch.title,
        order: ch.order,
        courseId,
      });
      for (const ls of ch.lessons) {
        await ctx.db.insert("lessons", {
          title: ls.title,
          content: ls.content,
          order: ls.order,
          duration: ls.duration,
          chapterId,
        });
      }
    }

    return courseId;
  },
});


