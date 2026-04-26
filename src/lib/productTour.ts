import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { NavigateFunction } from "react-router-dom";

/**
 * Interactive onboarding tour driving users across the core MVP flow:
 * Dashboard → Knowledge → Documentation → Regulations → Agents → New Analysis → User menu.
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
          description: "Three core modules: <b>Knowledge</b>, <b>Integrations</b> and <b>Agents</b>. People sits next to them.",
        },
      },
      {
        element: '[data-tour="nav-knowledge"]',
        popover: { title: "Knowledge", description: "Your single source of truth: <b>Regulations</b>, <b>Documentation</b> (Policies → Standards → Procedures) and <b>Training</b>." },
        onHighlightStarted: () => { void go("/knowledge"); },
      },
      {
        element: '[data-tour="nav-docs"]',
        popover: { title: "Documentation", description: "The hierarchy your auditors expect — Policies set the why, Procedures tell teams how." },
        onHighlightStarted: () => { void go("/knowledge/processes"); },
      },
      {
        element: '[data-tour="nav-regs"]',
        popover: { title: "Regulations", description: "Track requirements from regulators (ACPR, EBA, OFAC, CNIL…) and assign them to teams." },
        onHighlightStarted: () => { void go("/knowledge/regulations"); },
      },
      {
        element: '[data-tour="nav-agents"]',
        popover: {
          title: "Agents",
          description: "Autonomous workers in three patterns: <b>Collection</b>, <b>Analysis</b> and <b>Action</b>. Trigger manually, weekly, or on a custom cron.",
        },
        onHighlightStarted: () => { void go("/agents"); },
      },
      {
        element: '[data-tour="nav-upload"]',
        popover: { title: "New analysis", description: "Drop a document here and let the analyzing agent score it against your regulations." },
        onHighlightStarted: () => { void go("/upload"); },
      },
      {
        element: '[data-tour="user-menu"]',
        popover: { title: "Your account", description: "Profile, Settings, and you can re-launch this <b>Resources & Guide</b> tour any time." },
      },
    ],
  });

  d.drive();
}