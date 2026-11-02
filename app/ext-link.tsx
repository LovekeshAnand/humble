import type { ComponentProps } from "react";

// External link that opens in a new tab and says so to screen readers.
export default function ExtLink({ children, ...props }: ComponentProps<"a">) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}
