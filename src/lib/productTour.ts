import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { NavigateFunction } from "react-router-dom";

/**
 * Guided product tour.
 * - Each step targets a DIFFERENT element (sidebar group OR in-module element)
 * - Navigates to the relevant route before highlighting
 * - Waits for the target element to mount, then optionally auto-advances after `autoMs`
 */

type TourStep = {
  /** route to navigate to before showing the step */
  route?: string;
  /** CSS selector(s) — first one to appear wins */
  selector: string | string[];
  title: string;
  description: string;
  /** auto-advance after this many ms; 0/undefined = wait for user click */
  autoMs?: number;
};

const STEPS: TourStep[] = [
  {
    route: "/dashboard",
    selector: '[data-tour="module-title"]',
    title: "Welcome to MERIDIAN",
    description:
      "This tour follows the real workflow: <b>1)</b> add a source, <b>2)</b> document a regulation or sanction, <b>3)</b> let AI generate training, <b>4)</b> take the quiz, <b>5)</b> review your profile. It auto-advances — click <b>Next</b> to skip.",
    autoMs: 5000,
  },
  {
    route: "/dashboard",
    selector: '[data-tour="group-catalog"]',
    title: "Step 1 · A new source is added",
    description:
      "Everything starts here. <b>Sources</b> is where data enters the platform — uploaded documents and external connectors that sync continuously.",
    autoMs: 4500,
  },
  {
    route: "/catalog",
    selector: '[data-tour="module-header"]',
    title: "Step 1 · Browse & connect sources",
    description:
      "Pick an existing connector or upload a new document. Each source is classified, indexed and made available to the rest of the platform.",
    autoMs: 5000,
  },
  {
    route: "/upload",
    selector: '[data-tour="module-header"]',
    title: "Step 1 · Run an analysis",
    description:
      "Drop a document — MERIDIAN extracts entities, scores risk and links it to the relevant regulations automatically.",
    autoMs: 5000,
  },
  {
    route: "/dashboard",
    selector: '[data-tour="group-knowledge"]',
    title: "Step 2 · Knowledge is built",
    description:
      "From sources we derive <b>Knowledge</b>: regulations, internal documentation and the sanctions case library.",
    autoMs: 4500,
  },
  {
    route: "/knowledge/regulations",
    selector: '[data-tour="module-header"]',
    title: "Step 2 · Regulations & sanctions documented",
    description:
      "Each regulation and enforcement case is documented with severity, regulator, jurisdiction and the internal documentation it impacts.",
    autoMs: 5500,
  },
  {
    route: "/knowledge/regulations",
    selector: '[data-tour="module-header"]',
    title: "Step 3 · Generate AI learning material",
    description:
      "Open any regulation or sanction and click <b>Generate training</b>. AI drafts a module — pick the team, link the documentation and the quiz is built for you.",
    autoMs: 6000,
  },
  {
    route: "/knowledge/training",
    selector: '[data-tour="module-header"]',
    title: "Step 4 · Take the quiz",
    description:
      "Generated modules ship with multiple-choice quizzes. Wrong answers trigger an immediate alert pointing back to the source documentation.",
    autoMs: 5500,
  },
  {
    route: "/dashboard",
    selector: '[data-tour="group-people"]',
    title: "Step 5 · People & accountability",
    description:
      "Teams and people-ops let you assign documentation, training and accountability to the right humans.",
    autoMs: 4500,
  },
  {
    route: "/profile",
    selector: '[data-tour="module-header"], main',
    title: "Step 5 · Your profile",
    description:
      "Your profile is where you see assigned training, completion scores, the documentation you own and your activity across the platform.",
    autoMs: 5500,
  },
  {
    route: "/profile",
    selector: '[data-tour="user-menu"]',
    title: "You're ready",
    description:
      "Open your account menu any time to relaunch this tour, switch settings or sign out. Happy compliance!",
  },
];

/** Wait for an element matching one of the selectors to appear in the DOM. */
async function waitForElement(selectors: string[], timeoutMs = 4000): Promise<Element | null> {
  const start = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return resolve(el);
      }
      if (performance.now() - start > timeoutMs) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export function startProductTour(navigate: NavigateFunction) {
  let advanceTimer: ReturnType<typeof setTimeout> | null = null;
  const clearTimer = () => {
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
  };

  const driverSteps = STEPS.map((s, idx) => {
    const selectors = Array.isArray(s.selector) ? s.selector : [s.selector];
    return {
      element: selectors[0],
      popover: {
        title: s.title,
        description:
          s.description +
          (s.autoMs
            ? `<div style="margin-top:8px;font-size:11px;opacity:.6">Auto-advancing in ${(s.autoMs / 1000).toFixed(0)}s · click Next to skip</div>`
            : ""),
      },
      onHighlightStarted: async (_el: Element | undefined, _step: unknown, opts: { driver: Driver }) => {
        clearTimer();
        if (s.route && location.pathname !== s.route) {
          navigate(s.route);
        }
        const target = await waitForElement(selectors, 3500);
        if (target) {
          // Re-point driver to the actual element once it's mounted
          const cfg = opts.driver.getActiveStep();
          if (cfg) cfg.element = target as HTMLElement;
          opts.driver.refresh();
        }
        if (s.autoMs && idx < STEPS.length - 1) {
          advanceTimer = setTimeout(() => {
            try { opts.driver.moveNext(); } catch { /* tour closed */ }
          }, s.autoMs);
        }
      },
      onDeselected: () => clearTimer(),
    };
  });

  const d = driver({
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.55,
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Got it",
    onDestroyed: () => clearTimer(),
    steps: driverSteps,
  });

  d.drive();
}
