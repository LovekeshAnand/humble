"use client";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { saved, useSaved } from "@/lib/saved";

// Save or unsave a tool from anywhere; the list lives on /saved.
export function SaveButton({ id, name, large = false }: { id: string; name: string; large?: boolean }) {
  const isSaved = useSaved().liked.includes(id);
  return (
    <button
      type="button"
      className={`btn ${large ? "" : "btn-sm"} ${isSaved ? "btn-primary" : "btn-secondary"}`}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${name} from saved` : `Save ${name}`}
      onClick={() => saved.toggle(id)}
    >
      <BookmarkSimpleIcon size={large ? 20 : 16} weight={isSaved ? "fill" : "regular"} aria-hidden="true" />
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}
