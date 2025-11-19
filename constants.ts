// REMOVED_AI: removed AI integration - local only
import { Template } from "./types";

export const STAGES = [
  'Problem Understanding',
  'Research',
  'User Insights & Persona',
  'Journey Mapping',
  'Sketching / Ideation',
  'User Flow / IA',
  'Wireframes (Low/Mid)',
  'UI Design (High-Fidelity)',
  'Prototype',
  'Usability Testing',
  'Iteration',
  'Case Study / Delivery'
];

export const TEMPLATES: Template[] = [
  {
    key: 'problem',
    label: 'Problem Statement',
    desc: 'One sentence formula',
    content: `Problem statement (one line)
Formula: Users struggle with [X] because [Y]. We will improve [Z] so that [benefit].

Example: Users struggle to find saved orders because the menu is hidden. We will improve discoverability so returning buyers complete checkout faster.`
  },
  {
    key: 'research',
    label: 'Research Script',
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
    content: `Journey map (simple)

Stages (left→right): Awareness → Entry → Task → Completion → Aftercare

For each stage: user action, feelings, pain points, opportunities (ideas).`
  },
  {
    key: 'wireframe',
    label: 'Wireframe Checklist',
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
    content: `Prototype tips

- Timebox flows (3 primary tasks)
- Use realistic content
- Keep transitions minimal & purposeful
- Test path completion, not fancy animation`
  },
  {
    key: 'test',
    label: 'Usability Test Script',
    content: `Usability test script (moderated)

1) Task 1: "Find X and do Y" — observe success/time
2) Task 2: "Complete checkout" — observe confusion

Metrics: Success (yes/no), time, observed errors
Collect quotes: "I expected..."`
  },
  {
    key: 'case',
    label: 'Case Study Outline',
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