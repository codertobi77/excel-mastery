import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    emailVerified: v.optional(v.number()), // ms since epoch
    image: v.optional(v.string()),
    password: v.string(),
    nationality: v.string(),
    age: v.number(),
    gender: v.string(),
    credits: v.number(),
    level: v.string(), // BEGINNER, INTERMEDIATE, ADVANCED
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  accounts: defineTable({
    userId: v.id("users"),
    type: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
    refresh_token: v.optional(v.string()),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    token_type: v.optional(v.string()),
    scope: v.optional(v.string()),
    id_token: v.optional(v.string()),
    session_state: v.optional(v.string()),
  })
    .index("by_user", ["userId"]) 
    .index("by_provider_account", ["provider", "providerAccountId"]),

  sessions: defineTable({
    sessionToken: v.string(),
    userId: v.id("users"),
    expires: v.number(),
  })
    .index("by_user", ["userId"]) 
    .index("by_token", ["sessionToken"]),

  courses: defineTable({
    title: v.string(),
    description: v.string(),
    level: v.string(),
    duration: v.number(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  chapters: defineTable({
    title: v.string(),
    order: v.number(),
    courseId: v.id("courses"),
  }).index("by_course_order", ["courseId", "order"]),

  lessons: defineTable({
    title: v.string(),
    content: v.string(),
    order: v.number(),
    duration: v.number(),
    chapterId: v.id("chapters"),
  }).index("by_chapter_order", ["chapterId", "order"]),

  categories: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  exercises: defineTable({
    title: v.string(),
    description: v.string(),
    difficulty: v.string(),
    content: v.string(),
    solution: v.string(),
    categoryId: v.id("categories"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_category", ["categoryId"]),

  userProgress: defineTable({
    userId: v.id("users"),
    skillLevel: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  lessonProgress: defineTable({
    lessonId: v.id("lessons"),
    progressId: v.id("userProgress"),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
  }).index("by_lesson_user", ["lessonId", "progressId"]),

  exerciseProgress: defineTable({
    exerciseId: v.id("exercises"),
    progressId: v.id("userProgress"),
    completed: v.boolean(),
    score: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_exercise_user", ["exerciseId", "progressId"]),

  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.string(), // 'user' | 'assistant'
    content: v.string(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId", "createdAt"]),

  placementTests: defineTable({
    userId: v.id("users"),
    level: v.string(), // INTERMEDIATE | ADVANCED
    questionsJson: v.string(),
    createdAt: v.number(),
  }).index("by_user_level", ["userId", "level"]),

  courseSnapshots: defineTable({
    userId: v.id("users"),
    topic: v.string(),
    dataJson: v.string(),
    createdAt: v.number(),
  }).index("by_user_topic", ["userId", "topic"]),

  placementResults: defineTable({
    userId: v.id("users"),
    level: v.string(),
    analysis: v.string(),
    answersJson: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  practiceSheets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    dataJson: v.string(),
    metaJson: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_user_name", ["userId", "name"]),
});


