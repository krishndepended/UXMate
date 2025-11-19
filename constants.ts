
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

// Extended Template Interface for internal use
export interface RichTemplate extends Template {
  preview: string; // Short excerpt for the card
  example: string; // Full filled-out example text
  variables?: Record<string, string>; // Default values for variables
}

export const TEMPLATES: RichTemplate[] = [
  {
    key: 'problem',
    label: 'Problem Statement',
    category: 'Strategy',
    tags: ['definition', 'goals'],
    desc: 'Standard formula to define the user need.',
    preview: 'Users struggle with [Problem] because [Root Cause]. We will improve [Metric]...',
    content: `### Problem Statement
**Formula:** Users struggle with {{problem}} because {{rootCause}}.

**Our Solution:** We will improve {{focusArea}} so that {{benefit}}.

**Business Goal:** Increase {{metric}} by {{percentage}}%.`,
    example: `### Problem Statement
**Formula:** Users struggle with finding saved recipes because the profile menu is hidden.

**Our Solution:** We will improve the navigation hierarchy so that users can access favorites in one tap.

**Business Goal:** Increase retention by 15%.`
  },
  {
    key: 'research_script',
    label: 'User Interview Script',
    category: 'Research',
    tags: ['interview', 'qualitative'],
    desc: 'A 5-question guide for user discovery interviews.',
    preview: '1. Intro & Consent. 2. Warm up about [Topic]. 3. Task walk-through...',
    content: `### User Interview Script: {{topic}}
**Goal:** Understand how users currently handle {{task}}.
**Participant:** {{participantName}} | **Date:** {{date}}

**1. Introduction**
"Hi, I'm {{interviewerName}}. I'm trying to understand how people {{task}}. There are no wrong answers."

**2. Warm-up**
- "Tell me about the last time you tried to {{task}}."
- "How do you currently solve this problem?"

**3. Core Questions**
1. "What is the hardest part about {{task}}?"
2. "What tools do you currently use? What do you like/hate about them?"
3. "If you had a magic wand, how would you fix this process?"

**4. Wrap up**
- "Is there anything else I should have asked?"`,
    example: `### User Interview Script: Grocery Shopping
**Goal:** Understand how users currently handle weekly meal planning.
**Participant:** Alex | **Date:** Oct 12

**1. Introduction**
"Hi, I'm Sam. I'm trying to understand how people buy groceries..."

**2. Warm-up**
- "Tell me about the last time you went grocery shopping."
...`
  },
  {
    key: 'persona',
    label: 'Full Persona',
    category: 'Research',
    tags: ['users', 'empathy'],
    desc: 'Detailed user profile with goals and frustrations.',
    preview: 'Name: [Name] | Quote: "I want to..." | Goals: [Goal 1], [Goal 2]...',
    content: `### Persona: {{name}}
**Role:** {{role}} | **Age:** {{age}}

> "{{quote}}"

**Bio**
{{name}} is a {{role}} who interacts with technology {{techLevel}}. They value {{values}}.

**Goals**
1. {{goal1}}
2. {{goal2}}

**Frustrations**
1. {{painPoint1}}
2. {{painPoint2}}

**Preferred Channels:** Mobile, Email`,
    example: `### Persona: Sarah
**Role:** Busy Mom | **Age:** 34

> "I just want to get dinner on the table without thinking."

**Bio**
Sarah is a part-time teacher who uses her phone for everything. She values speed and healthy options.

**Goals**
1. Find recipes under 30 mins.
2. Save money on groceries.

**Frustrations**
1. Too many ads on recipe sites.
2. Ingredients are often out of stock.`
  },
  {
    key: 'journey',
    label: 'User Journey Map',
    category: 'Strategy',
    tags: ['flow', 'mapping'],
    desc: 'Phased breakdown of user experience.',
    preview: 'Stages: Awareness -> Consideration -> Decision -> Retention...',
    content: `### Journey Map: {{scenario}}

| Stage | Actions | Thinking | Feeling (1-5) | Opportunities |
|-------|---------|----------|---------------|---------------|
| **Discovery** | {{action1}} | "I need to solve X" | 😐 (3) | SEO, Social Ads |
| **Search** | {{action2}} | "Which option is best?" | 😕 (2) | Clear comparisons |
| **Usage** | {{action3}} | "This is easy/hard" | 🙂 (4) | Tooltips, Defaults |
| **Exit** | {{action4}} | "I'm done." | 😃 (5) | Follow-up email |`,
    example: `### Journey Map: Buying a Ticket...`
  },
  {
    key: 'usability_test',
    label: 'Usability Test Plan',
    category: 'Testing',
    tags: ['validation', 'tasks'],
    desc: 'Plan for validating designs with users.',
    preview: 'Task 1: Find [Item]. Success Criteria: Under 30s. Task 2: ...',
    content: `### Usability Test Plan: {{featureName}}

**Objective:** Validate if users can complete {{primaryTask}} without errors.

**Task 1: {{task1}}**
- **Prompt:** "Show me how you would {{task1}}."
- **Success Criteria:** Completes in under {{timeGoal}}.
- **Observations:** [ ]

**Task 2: {{task2}}**
- **Prompt:** "Now, try to {{task2}}."
- **Success Criteria:** No critical errors.
- **Observations:** [ ]

**Post-Test Question:**
On a scale of 1-5, how easy was that?`,
    example: `### Usability Test Plan: Checkout Flow...`
  },
  {
    key: 'case_study',
    label: 'Case Study Outline',
    category: 'Delivery',
    tags: ['portfolio', 'docs'],
    desc: 'Structure for your final portfolio presentation.',
    preview: '1. Project Overview. 2. The Problem. 3. The Process. 4. The Outcome...',
    content: `### Case Study: {{projectTitle}}

**1. Overview**
- **Role:** {{myRole}}
- **Timeline:** {{timeline}}
- **Tools:** Figma, UXMate

**2. The Problem**
{{problemSummary}}

**3. The Process**
- **Research:** Surveyed {{userCount}} users. Key insight: {{insight}}.
- **Design:** Iterated on wireframes to solve {{painPoint}}.
- **Testing:** Improved success rate by {{improvement}}%.

**4. The Outcome**
Final design launched on {{launchDate}}.`,
    example: `### Case Study: Eco-Friendly App...`
  }
];
