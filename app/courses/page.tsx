'use client'
import { redirect } from "next/navigation";

export default function CoursesPage() {
  // Route learning features exclusively via dashboard
  redirect("/dashboard/courses");
}
