import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { NavigateFunction } from "react-router-dom";

/**
 * Streamlined onboarding tour aligned with the 5 sidebar groups,
 * walking from data ingress (Connections) up to Automation.
 */
export function startProductTour(navigate: NavigateFunction) {
  const go = async (path: string, ms = 350) => {
    navigate(path);
    await new Promise((r) => setTimeout(r, ms));
  };

  const d = driver({
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.55,
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Got it",
    steps: [
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: "Welcome to MERIDIAN",
          description:
            "Five groups, one flow — from <b>Connections</b> at the bottom (where data comes in) up to <b>Automation</b> at the top.",
        },
        onHighlightStarted: () => { void go("/dashboard"); },
      },
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: "Connections",
          description: "Bring data in: documents you upload and external connectors feeding the platform.",
        },
        onHighlightStarted: () => { void go("/upload"); },
      },
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: "Knowledge",
          description: "Your single source of truth: <b>Regulations</b>, <b>Documentation</b> and <b>Training</b>.",
        },
        onHighlightStarted: () => { void go("/knowledge"); },
      },
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: "People",
          description: "Teams, ownership and people-ops — who is responsible for what.",
        },
        onHighlightStarted: () => { void go("/people"); },
      },
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: "Decision Intelligence",
          description: "Every decision is logged: explore the trail, related policies and outcomes.",
        },
        onHighlightStarted: () => { void go("/telemetry"); },
      },
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: "Automation",
          description: "Agents that collect, analyze and act — manual, scheduled or event-driven.",
        },
        onHighlightStarted: () => { void go("/agents"); },
      },
      {
        element: '[data-tour="user-menu"]',
        popover: {
          title: "Your account",
          description: "Profile, Settings (admins) and re-launch this guide any time.",
        },
        onHighlightStarted: () => { void go("/dashboard"); },
      },
    ],
  });

  d.drive();
}
