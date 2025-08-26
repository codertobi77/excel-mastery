/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as categories from "../categories.js";
import type * as chapters from "../chapters.js";
import type * as conversations from "../conversations.js";
import type * as courses from "../courses.js";
import type * as exercises from "../exercises.js";
import type * as lessons from "../lessons.js";
import type * as messages from "../messages.js";
import type * as progress from "../progress.js";
import type * as userProgress from "../userProgress.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  chapters: typeof chapters;
  conversations: typeof conversations;
  courses: typeof courses;
  exercises: typeof exercises;
  lessons: typeof lessons;
  messages: typeof messages;
  progress: typeof progress;
  userProgress: typeof userProgress;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
