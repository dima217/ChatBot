"use client";

import * as React from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useLayoutEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = () => setMatches(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
