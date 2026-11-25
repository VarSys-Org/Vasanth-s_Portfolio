import { useEffect, useState } from "react";

export type SiteStatus = "checking" | "online" | "offline";

const cache = new Map<string, SiteStatus>();
const waiting = new Map<string, Promise<SiteStatus>>();

// A no-cors request cannot read the response, but it only resolves when the
// server answered, which is enough to tell a visitor the site is up.
export function pingSite(url: string): Promise<SiteStatus> {
  const known = waiting.get(url);
  if (known) return known;
  const job = fetch(url, { mode: "no-cors", cache: "no-store", signal: AbortSignal.timeout(9000) })
    .then(() => "online" as const)
    .catch(() => "offline" as const)
    .then((status) => {
      cache.set(url, status);
      return status;
    });
  waiting.set(url, job);
  return job;
}

export function useSiteStatus(urls: string[]) {
  const [status, setStatus] = useState<Record<string, SiteStatus>>(() =>
    Object.fromEntries(urls.map((u) => [u, cache.get(u) ?? "checking"])),
  );
  const key = urls.join("|");

  useEffect(() => {
    let live = true;
    key.split("|").forEach((url) => {
      pingSite(url).then((s) => {
        if (live) setStatus((prev) => ({ ...prev, [url]: s }));
      });
    });
    return () => {
      live = false;
    };
  }, [key]);

  return status;
}

export const statusText: Record<SiteStatus, string> = {
  checking: "Checking",
  online: "Online",
  offline: "No response",
};
