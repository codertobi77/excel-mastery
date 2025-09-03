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
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).unique();
    if (existing) {
      const patch: any = { firstName: args.firstName, lastName: args.lastName, image: args.image, updatedAt: now };
      if (args.clerkId) patch.clerkId = args.clerkId;
      await ctx.db.patch(existing._id, patch);
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
      clerkId: args.clerkId,
      password: "", // managed by Clerk
      nationality: "",
      age: 0,
      gender: "",
      credits: 50,
      plan: "FREE",
      level: "BEGINNER",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("userProgress", { userId, skillLevel: "BEGINNER", createdAt: now, updatedAt: now });
    return userId;
  },
});


export const updateProfileByEmail = mutation({
  args: {
    email: v.string(),
    gender: v.optional(v.string()),
    age: v.optional(v.number()),
    nationality: v.optional(v.string()),
  },
  handler: async (ctx, { email, gender, age, nationality }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", email))
      .unique();
    if (!existing) return null;
    const patch: any = { updatedAt: now };
    if (typeof gender === 'string') patch.gender = gender;
    if (typeof age === 'number') patch.age = age;
    if (typeof nationality === 'string') patch.nationality = nationality;
    await ctx.db.patch(existing._id, patch);
    return existing._id;
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db.query("users").withIndex("by_clerk", q => q.eq("clerkId", clerkId)).unique();
  },
});

export const updatePlan = mutation({
  args: {
    clerkId: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, { clerkId, plan }) => {
    const now = Date.now();
    const user = await ctx.db.query("users").withIndex("by_clerk", q => q.eq("clerkId", clerkId)).unique();
    if (!user) return null;
    
    await ctx.db.patch(user._id, { 
      plan,
      updatedAt: now,
    });
    return user._id;
  },
});


export const decrementCreditsByClerkId = mutation({
  args: { clerkId: v.string(), amount: v.number() },
  handler: async (ctx, { clerkId, amount }) => {
    const user = await ctx.db.query("users").withIndex("by_clerk", q => q.eq("clerkId", clerkId)).unique();
    if (!user) return null;
    const next = Math.max(0, (user.credits || 0) - Math.max(1, Math.floor(amount)));
    await ctx.db.patch(user._id, { credits: next, updatedAt: Date.now() });
    return next;
  },
});

