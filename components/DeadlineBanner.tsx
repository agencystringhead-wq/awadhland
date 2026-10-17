"use client";

import { useEffect, useState } from "react";

export type DeadlineBannerProps = {
  /** YYYY-MM-DD, the last day the window is open (inclusive, India time) */
  deadline: string;
  /** Date already formatted for the page's language */
  dateLabel: string;
  labels: { open: string; closed: string; was: string };
  /** Decided at build time; the browser corrects it on load if the date has since passed */
  closedAtBuild: boolean;
};

/** Today in India as YYYY-MM-DD, whatever the visitor's time zone. */
const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

/**
 * Deadline banner for articles about an open window (registration, applications). The site is a
 * static export, so the build can only know the date it ran on; this re-checks in the browser and
 * switches to "closed" once the deadline has passed. The article itself stays live either way.
 */
export function DeadlineBanner({ deadline, dateLabel, labels, closedAtBuild }: DeadlineBannerProps) {
  const [closed, setClosed] = useState(closedAtBuild);
  useEffect(() => {
    setClosed(todayIST() > deadline);
  }, [deadline]);
  return (
    <div
      data-component="DeadlineBanner"
      data-state={closed ? "closed" : "open"}
      role="status"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border px-5 py-3.5 ${
        closed ? "border-line bg-cream-deep text-ink-soft" : "border-accent bg-accent-soft text-accent-deep"
      }`}
    >
      {closed ? (
        <p className="font-semibold">
          {labels.closed} <span className="font-normal">{labels.was} {dateLabel}.</span>
        </p>
      ) : (
        <p className="font-semibold">
          {labels.open}: <time dateTime={deadline}>{dateLabel}</time>
        </p>
      )}
    </div>
  );
}
