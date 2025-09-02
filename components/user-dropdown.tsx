"use client";

import { UserButton, SignedIn } from "@clerk/nextjs";

export function UserDropdown() {
  return (
    <SignedIn>
      <UserButton
        afterSignOutUrl="/"
        userProfileMode="modal"
      />
    </SignedIn>
  );
}
