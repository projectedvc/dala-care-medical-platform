"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type LoaderPhase = "visible" | "leaving" | "hidden";

export default function MedicalChrome() {
  const pathname = usePathname();
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const firstRoute = useRef(true);
  const [loaderPhase, setLoaderPhase] = useState<LoaderPhase>("visible");

  useEffect(() => {
    const fullSequence = firstRoute.current;
    firstRoute.current = false;
    const visibleTimer = window.setTimeout(() => setLoaderPhase("visible"), 0);

    const leavingTimer = window.setTimeout(
      () => setLoaderPhase("leaving"),
      fullSequence ? 1120 : 420,
    );
    const hiddenTimer = window.setTimeout(
      () => setLoaderPhase("hidden"),
      fullSequence ? 1580 : 790,
    );

    return () => {
      window.clearTimeout(visibleTimer);
      window.clearTimeout(leavingTimer);
      window.clearTimeout(hiddenTimer);
    };
  }, [pathname]);

  useEffect(() => {
    let frame = 0;
    let cursorX = -100;
    let cursorY = -100;

    const renderCursor = () => {
      cursorRef.current?.style.setProperty(
        "transform",
        `translate3d(${cursorX}px, ${cursorY}px, 0)`,
      );
      ringRef.current?.style.setProperty(
        "transform",
        `translate3d(${cursorX}px, ${cursorY}px, 0)`,
      );
      frame = 0;
    };

    const moveCursor = (event: PointerEvent) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
      cursorRef.current?.classList.add("is-ready");
      ringRef.current?.classList.add("is-ready");

      const target = event.target;
      const interactive =
        target instanceof Element &&
        Boolean(target.closest("a, button, input, textarea, select, [role='button']"));
      document.body.classList.toggle("medical-cursor-interactive", interactive);

      if (!frame) {
        frame = window.requestAnimationFrame(renderCursor);
      }
    };

    const pressCursor = () => document.body.classList.add("medical-cursor-pressed");
    const releaseCursor = () => document.body.classList.remove("medical-cursor-pressed");

    window.addEventListener("pointermove", moveCursor, { passive: true });
    window.addEventListener("pointerdown", pressCursor, { passive: true });
    window.addEventListener("pointerup", releaseCursor, { passive: true });
    window.addEventListener("pointercancel", releaseCursor, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.classList.remove("medical-cursor-interactive", "medical-cursor-pressed");
      window.removeEventListener("pointermove", moveCursor);
      window.removeEventListener("pointerdown", pressCursor);
      window.removeEventListener("pointerup", releaseCursor);
      window.removeEventListener("pointercancel", releaseCursor);
    };
  }, []);

  return (
    <>
      {loaderPhase !== "hidden" && (
        <div
          className={`medical-loader ${loaderPhase === "leaving" ? "is-leaving" : ""}`}
          role="status"
          aria-label="Loading clinical workspace"
        >
          <div className="loader-diagnostic">
            <div className="loader-orbit orbit-one" />
            <div className="loader-orbit orbit-two" />
            <div className="loader-cross">+</div>
            <svg className="loader-ecg" viewBox="0 0 420 80" aria-hidden="true">
              <path d="M2 43h78l13-1 9-18 14 39 15-57 18 70 17-33h58l9-1 8-13 14 27 13-42 16 51 14-23h104" />
            </svg>
          </div>
          <div className="loader-copy">
            <span>Dala clinical system</span>
            <strong>Connecting patient context</strong>
            <small>VITALS · RECORDS · EVIDENCE</small>
          </div>
          <div className="loader-progress"><i /></div>
        </div>
      )}

      <div ref={ringRef} className="medical-cursor-ring" aria-hidden="true">
        <svg viewBox="0 0 42 18">
          <path d="M0 10h10l3-7 5 14 5-10 4 3h15" />
        </svg>
      </div>
      <div ref={cursorRef} className="medical-cursor-point" aria-hidden="true">
        <i />
      </div>
    </>
  );
}
