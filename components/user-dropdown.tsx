"use client";

import { UserButton, SignedIn } from "@clerk/nextjs";

const userButtonAppearance = {
  elements: {
    userButtonBox: "rounded-md border border-border bg-background hover:bg-muted/70 transition-colors",
    userButtonTrigger: "ring-0 focus:outline-none",
    userButtonAvatarBox: "h-8 w-8",
    userButtonPopoverCard: "rounded-lg border border-border shadow-xl bg-background",
    userButtonPopoverHeader: "p-3",
    userPreviewMainIdentifier: "text-foreground font-medium",
    userPreviewSecondaryIdentifier: "text-muted-foreground",
    userButtonPopoverActions: "p-2 space-y-1",
    userButtonPopoverActionButton: "text-sm rounded-md hover:bg-muted/80 text-foreground",
    userButtonPopoverActionButtonIcon: "text-muted-foreground",
    userButtonPopoverFooter: "p-2 border-t border-border",
  },
} as const;

export function UserDropdown() {
  return (
    <SignedIn>
      <UserButton
        afterSignOutUrl="/"
        userProfileMode="modal"
        appearance={userButtonAppearance}
      />
    </SignedIn>
  );
}
