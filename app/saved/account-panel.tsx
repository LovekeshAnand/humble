"use client";
import { Show, SignInButton, useUser } from "@clerk/nextjs";
import { CloudCheckIcon, CloudArrowUpIcon } from "@phosphor-icons/react";

// Where saves live: this browser only (signed out), or the visitor's account on every device (signed in).
export default function AccountPanel() {
  const { user } = useUser();
  return (
    <section aria-label="Sync" className="mx-auto mt-10 max-w-3xl rounded-3xl border border-line-strong bg-raised p-6 text-left">
      <Show when="signed-out">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex max-w-md items-start gap-4">
            <CloudArrowUpIcon size={28} className="mt-1 shrink-0 text-save" aria-hidden="true" />
            <div>
              <p className="font-semibold">Saved in this browser only</p>
              <p className="mt-1 text-sm text-fg-muted">
                Browsers can clear these, and they do not move between your phone and computer. Sign in to keep them on every device.
              </p>
            </div>
          </div>
          <SignInButton mode="modal">
            <button type="button" className="btn btn-primary">Sign in to sync</button>
          </SignInButton>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="flex items-start gap-4">
          <CloudCheckIcon size={28} className="mt-1 shrink-0 text-save" aria-hidden="true" />
          <div>
            <p className="font-semibold">Synced to your account</p>
            <p className="mt-1 text-sm text-fg-muted">
              Signed in{user?.primaryEmailAddress ? ` as ${user.primaryEmailAddress.emailAddress}` : ""}. Every save and removal follows you to any device you sign in on.
            </p>
          </div>
        </div>
      </Show>
    </section>
  );
}
