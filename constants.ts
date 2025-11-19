
// REMOVED_AI: removed AI integration - local only
import { Template } from "./types";

export interface StageDef {
  id: string;
  label: string;
  help: string;
}

export const STAGES: StageDef[] = [
  { id: 'Problem Understanding', label: 'Problem Understanding', help: 'Define the core user problem and align on business goals.' },
  { id: 'Research', label: 'Research', help: 'Conduct user interviews, surveys, and competitive analysis.' },
  { id: 'User Insights & Persona', label: 'User Insights & Persona', help: 'Synthesize findings into personas, empathy maps, and key insights.' },
  { id: 'Journey Mapping', label: 'Journey Mapping', help: 'Map out the current and future state user journeys.' },
  { id: 'Sketching / Ideation', label: 'Sketching / Ideation', help: 'Brainstorm diverse solutions and sketch rough ideas (Crazy 8s).' },
  { id: 'User Flow / IA', label: 'User Flow / IA', help: 'Define the information architecture, sitemap, and user flows.' },
  { id: 'Wireframes (Low/Mid)', label: 'Wireframes (Low/Mid)', help: 'Create structural layouts to focus on functionality without visual design.' },
  { id: 'UI Design (High-Fidelity)', label: 'UI Design (High-Fidelity)', help: 'Apply visual systems, typography, colors, and branding.' },
  { id: 'Prototype', label: 'Prototype', help: 'Build interactive prototypes to simulate the final experience.' },
  { id: 'Usability Testing', label: 'Usability Testing', help: 'Test with real users, observe behavior, and gather feedback.' },
  { id: 'Iteration', label: 'Iteration', help: 'Refine and improve the design based on testing results.' },
  { id: 'Case Study / Delivery', label: 'Case Study / Delivery', help: 'Document the process, prepare assets for handoff, and export case study.' }
];

export const TEMPLATES: Template[] = [
  {
    key: 'problem',
    label: 'Problem Statement',
    category: 'Strategy',
    tags: ['definition', 'goals'],
    desc: 'One sentence formula',
    content: `Problem statement (one line)
Formula: Users struggle with [X] because [Y]. We will improve [Z] so that [benefit].

Example: Users struggle to find saved orders because the menu is hidden. We will improve discoverability so returning buyers complete checkout faster.`
  },
  {
    key: 'research',
    label: 'Research Script',
    category: 'Research',
    tags: ['interview', 'survey'],
    desc: 'Interview + Survey guide',
    content: `Research script — Interview guide (5–8 minutes)

1) Intro: purpose & consent
2) Warm-up: Tell me about how you currently [task]
3) Task: Ask them to try/describe steps
4) Probing questions: What frustrates you? What matters most?
5) Closing: Anything else you want to share?

Survey quick items: frequency, satisfaction (1–5), biggest pain point.`
  },
  {
    key: 'persona',
    label: 'Persona Template',
    category: 'Research',
    tags: ['users', 'empathy'],
    content: `Persona template

Name: (e.g., Kavya)
Age:
Occupation:
Goals:
Frustrations:
Tech comfort:
Quote: "I want..."

Implications: What this means for design.`
  },
  {
    key: 'journey',
    label: 'Journey Map',
    category: 'Strategy',
    tags: ['mapping', 'flow'],
    content: `Journey map (simple)

Stages (left→right): Awareness → Entry → Task → Completion → Aftercare

For each stage: user action, feelings, pain points, opportunities (ideas).`
  },
  {
    key: 'wireframe',
    label: 'Wireframe Checklist',
    category: 'Design',
    tags: ['lo-fi', 'structure'],
    content: `Wireframe checklist

- Clear hierarchy for main action
- Layout aligns to grid
- Tap targets >= 44px
- Focused primary CTA
- Reduce cognitive load (no more than 5 choices)
- Accessible labels and alt text`
  },
  {
    key: 'ui',
    label: 'UI Checklist',
    category: 'Design',
    tags: ['hi-fi', 'style'],
    desc: 'Style guide basics',
    content: `UI checklist & style system

- Typography scale (H1, H2, body)
- Color palette (primary, secondary, states)
- Spacing tokens
- Component list (button, input, card)
- States (hover, active, disabled)
- Accessibility checks (contrast ratio, keyboard nav)`
  },
  {
    key: 'prototype',
    label: 'Prototype Tips',
    category: 'Design',
    tags: ['interaction', 'flow'],
    content: `Prototype tips

- Timebox flows (3 primary tasks)
- Use realistic content
- Keep transitions minimal & purposeful
- Test path completion, not fancy animation`
  },
  {
    key: 'test',
    label: 'Usability Test Script',
    category: 'Testing',
    tags: ['validation', 'observation'],
    content: `Usability test script (moderated)

1) Task 1: "Find X and do Y" — observe success/time
2) Task 2: "Complete checkout" — observe confusion

Metrics: Success (yes/no), time, observed errors
Collect quotes: "I expected..."`
  },
  {
    key: 'case',
    label: 'Case Study Outline',
    category: 'Strategy',
    tags: ['portfolio', 'docs'],
    content: `Case study outline (1–2 pages)

1) Title & 1-line summary
2) Problem & goal
3) Research highlights
4) Key insights & persona
5) Flow & wireframes (before→after)
6) Final UI screens & prototype link
7) Testing & results (before→after)
8) Learnings`
  }
];
