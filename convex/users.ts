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

export const updateSubscriptionMeta = mutation({
  args: {
    clerkId: v.string(),
    interval: v.optional(v.string()), // PRO_MONTH | PRO_YEAR
    trialEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, interval, trialEndsAt }) => {
    const user = await ctx.db.query("users").withIndex("by_clerk", q => q.eq("clerkId", clerkId)).unique();
    if (!user) return null;
    const patch: any = { updatedAt: Date.now() };
    if (interval) patch.subscriptionInterval = interval;
    if (typeof trialEndsAt === 'number') patch.trialEndsAt = trialEndsAt;
    await ctx.db.patch(user._id, patch);
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

export const deleteUserCascadeByClerkId = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", q => q.eq("clerkId", clerkId))
      .unique();
    if (!user) return null;

    // Delete sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();
    for (const s of sessions) await ctx.db.delete(s._id);

    // Delete accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();
    for (const a of accounts) await ctx.db.delete(a._id);

    // Delete conversations and messages
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();
    for (const c of conversations) {
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversation", q => q.eq("conversationId", c._id))
        .collect();
      for (const m of msgs) await ctx.db.delete(m._id);
      await ctx.db.delete(c._id);
    }

    // Delete progress tree
    const up = await ctx.db
      .query("userProgress")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .unique();
    if (up) {
      // Best-effort: delete lessonProgress and exerciseProgress referencing this progress
      const lessonProg = await ctx.db.query("lessonProgress").collect();
      for (const lp of lessonProg) {
        if (lp.progressId === up._id) await ctx.db.delete(lp._id);
      }
      const exerciseProg = await ctx.db.query("exerciseProgress").collect();
      for (const ep of exerciseProg) {
        if (ep.progressId === up._id) await ctx.db.delete(ep._id);
      }
      await ctx.db.delete(up._id);
    }

    // Delete placement tests/results, snapshots, practice sheets
    const placementTests = await ctx.db
      .query("placementTests")
      .withIndex("by_user_level", q => q.eq("userId", user._id))
      .collect();
    for (const pt of placementTests) await ctx.db.delete(pt._id);

    const placementResults = await ctx.db
      .query("placementResults")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();
    for (const pr of placementResults) await ctx.db.delete(pr._id);

    const snapshots = await ctx.db
      .query("courseSnapshots")
      .withIndex("by_user_topic", q => q.eq("userId", user._id))
      .collect();
    for (const sn of snapshots) await ctx.db.delete(sn._id);

    const sheets = await ctx.db
      .query("practiceSheets")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();
    for (const sh of sheets) await ctx.db.delete(sh._id);

    // Finally, delete user
    await ctx.db.delete(user._id);
    return "ok";
  },
});

