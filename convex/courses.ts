import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

export const listWithProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // find user's progress row
    const up = await ctx.db.query("userProgress").withIndex("by_user", q => q.eq("userId", userId)).unique();
    const progressId = up?._id;

    const courses = await ctx.db.query("courses").collect();
    const result: any[] = [];

    for (const course of courses) {
      const chapters = await ctx.db.query("chapters").withIndex("by_course_order", q => q.eq("courseId", course._id)).collect();
      const lessons: any[] = [];
      for (const ch of chapters) {
        const ls = await ctx.db.query("lessons").withIndex("by_chapter_order", q => q.eq("chapterId", ch._id)).collect();
        lessons.push(...ls);
      }
      const totalLessons = lessons.length;
      let completedLessons = 0;
      const completedSet = new Set<string>();
      if (progressId) {
        for (const lesson of lessons) {
          const completed = await ctx.db
            .query("lessonProgress")
            .withIndex("by_lesson_user", q => q.eq("lessonId", lesson._id).eq("progressId", progressId))
            .unique();
          if (completed?.completed) {
            completedLessons += 1;
            completedSet.add(lesson._id as unknown as string);
          }
        }
      }

      // Determine next lesson: first not completed by order
      let nextLesson: any = null;
      for (const lesson of lessons) {
        if (!completedSet.has(lesson._id as unknown as string)) {
          nextLesson = lesson;
          break;
        }
      }

      result.push({
        course,
        totalLessons,
        completedLessons,
        percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        nextLesson: nextLesson ? { _id: nextLesson._id, title: nextLesson.title, content: nextLesson.content } : null,
      });
    }

    return result;
  },
});

export const getCourseDetail = query({
  args: { userId: v.id("users"), courseId: v.id("courses") },
  handler: async (ctx, { userId, courseId }) => {
    const course = await ctx.db.get(courseId)
    if (!course) return null
    const up = await ctx.db.query("userProgress").withIndex("by_user", q => q.eq("userId", userId)).unique();
    const progressId = up?._id
    const chapters = await ctx.db.query("chapters").withIndex("by_course_order", q => q.eq("courseId", courseId)).collect()
    const full: any[] = []
    for (const ch of chapters) {
      const ls = await ctx.db.query("lessons").withIndex("by_chapter_order", q => q.eq("chapterId", ch._id)).collect()
      const lessons = [] as any[]
      for (const l of ls) {
        let completed = false
        if (progressId) {
          const lp = await ctx.db
            .query("lessonProgress")
            .withIndex("by_lesson_user", q => q.eq("lessonId", l._id).eq("progressId", progressId))
            .unique()
          completed = Boolean(lp?.completed)
        }
        lessons.push({ _id: l._id, title: l.title, content: l.content, order: l.order, completed })
      }
      full.push({ _id: ch._id, title: ch.title, order: ch.order, lessons })
    }
    return { course, chapters: full }
  }
})

export const saveCourseSnapshot = mutation({
  args: { userId: v.id("users"), topic: v.string(), dataJson: v.string() },
  handler: async (ctx, { userId, topic, dataJson }) => {
    const now = Date.now()
    return await ctx.db.insert("courseSnapshots", { userId, topic, dataJson, createdAt: now })
  }
})

export const getCourseSnapshot = query({
  args: { userId: v.id("users"), topic: v.string() },
  handler: async (ctx, { userId, topic }) => {
    return await ctx.db
      .query("courseSnapshots")
      .withIndex("by_user_topic", q => q.eq("userId", userId).eq("topic", topic))
      .order("desc")
      .first()
  }
})

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


