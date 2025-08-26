import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db.query("users").withIndex("by_email", q => q.eq("email", email)).unique();
  },
});

export const upsertFromClerk = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { firstName: args.firstName, lastName: args.lastName, image: args.image, updatedAt: now });
      // Ensure progress exists
      const progress = await ctx.db.query("userProgress").withIndex("by_user", q => q.eq("userId", existing._id)).unique();
      if (!progress) {
        await ctx.db.insert("userProgress", { userId: existing._id, skillLevel: "BEGINNER", createdAt: now, updatedAt: now });
      }
      return existing._id;
    }
    const userId = await ctx.db.insert("users", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      image: args.image,
      password: "", // managed by Clerk
      nationality: "",
      age: 0,
      gender: "",
      credits: 10,
      level: "BEGINNER",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("userProgress", { userId, skillLevel: "BEGINNER", createdAt: now, updatedAt: now });
    return userId;
  },
});


