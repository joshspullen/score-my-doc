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
      "This quick tour walks you through the five pillars of the platform. Sit back — it advances on its own, but you can click <b>Next</b> any time.",
    autoMs: 5000,
  },
  {
    route: "/dashboard",
    selector: '[data-tour="group-intelligence"]',
    title: "Intelligence",
    description:
      "Decision logs, outcomes and (for admins) the agents that run autonomously. Everything the system decides is observable here.",
    autoMs: 4500,
  },
  {
    route: "/telemetry/traces",
    selector: '[data-tour="module-header"]',
    title: "Decision Log",
    description:
      "Every agent run leaves a trace: inputs, tools called, citations and the final decision — replayable and exportable.",
    autoMs: 5000,
  },
  {
    route: "/dashboard",
    selector: '[data-tour="group-people"]',
    title: "People",
    description:
      "Teams, ownership and people-ops. Assign documents, training and accountability to the right humans.",
    autoMs: 4500,
  },
  {
    route: "/dashboard",
    selector: '[data-tour="group-knowledge"]',
    title: "Knowledge",
    description:
      "Your single source of truth: <b>Regulations</b>, internal <b>Documentation</b> and <b>Training</b> — all linked together.",
    autoMs: 4500,
  },
  {
    route: "/knowledge/regulations",
    selector: '[data-tour="module-header"]',
    title: "Regulations in context",
    description:
      "Open any regulation or sanction case to generate a training module on the spot — assigned to the right team automatically.",
    autoMs: 5500,
  },
  {
    route: "/knowledge/training",
    selector: '[data-tour="module-header"]',
    title: "Training & quizzes",
    description:
      "Generated modules ship with multiple-choice quizzes. Wrong answers alert the learner so the gap closes immediately.",
    autoMs: 5500,
  },
  {
    route: "/dashboard",
    selector: '[data-tour="group-catalog"]',
    title: "Sources",
    description:
      "Where data enters the platform: documents you upload and external connectors that sync continuously.",
    autoMs: 4500,
  },
  {
    route: "/upload",
    selector: '[data-tour="module-header"]',
    title: "Run a new analysis",
    description:
      "Drop a document here. MERIDIAN will classify, score and route it — and surface any compliance gap.",
    autoMs: 5000,
  },
  {
    route: "/dashboard",
    selector: '[data-tour="user-menu"]',
    title: "Your account",
    description:
      "Profile, settings and the option to relaunch this tour any time. You're ready — let's go.",
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
