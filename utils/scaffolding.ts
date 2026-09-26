export const STAGE_SCAFFOLDS: Record<string, string> = {
  problem: `## 🎯 Problem Framing & Objectives

### Executive Summary
Briefly describe the product context and what core problem this project aims to solve.

### Problem Statement
- **Who:** [Target user segment experiencing the issue]
- **What:** [Specific friction, blocker, or inefficiency]
- **Why it Matters:** [Impact on business KPIs, retention, or user satisfaction]

### Success Criteria & Key Metrics
- [ ] Primary KPI: [e.g., Increase task completion rate from 45% to 75%]
- [ ] Secondary Metric: [e.g., Reduce onboarding time from 12 mins to <4 mins]
- [ ] Guardrail Metric: [e.g., Maintain zero drop in user satisfaction CSAT]

> 💡 **Core Insight:** State the fundamental reality of the problem that existing tools fail to solve.
`,

  research: `## 🔍 User Research & Findings

### Research Methodology
- **Approach:** [e.g., 6 moderated user interviews, 140 survey responses, competitive benchmarking]
- **Target Participants:** [e.g., Freelance product designers working in small teams]

### Key Observations & Evidence
1. **Friction 1:** [Detail what users struggled with and why]
2. **Friction 2:** [Detail unexpected behavioral patterns]
3. **Friction 3:** [Detail unmet needs or manual workarounds]

### Verbatim User Quotes
> "I find myself repeating the same setup over and over because current tools don't save my workflow states." — Participant #3

> 💡 **Synthesized Finding:** Users are willing to trade advanced customization for immediate simplicity and clarity.
`,

  persona: `## 👤 Primary User Persona

### Profile Overview
- **Name & Role:** [e.g., Maya Chen — Senior UX Lead]
- **Archetype:** [e.g., The Time-Constrained Strategist]
- **Context of Use:** [Desktop workstation, multi-tab browser, tight release cycles]

### Motivations & Goals
- Rapidly align cross-functional engineering and design partners
- Establish transparent design rationale without heavy documentation overhead

### Core Frustrations & Pain Points
- Disconnected research notes buried in spreadsheets
- High cognitive load when switching between visual design and strategy

> 💬 **Guiding Mantra:** "If I can't explain why we made this design decision in 30 seconds, we aren't ready to build it."
`,

  journey: `## 🗺️ User Journey & Moments of Truth

### Journey Scenario
[Describe the end-to-end task journey, e.g., Onboarding $\\rightarrow$ First Project Setup $\\rightarrow$ Review $\\rightarrow$ Export]

### Phase Breakdown
| Stage | User Goal | Emotional State | Primary Friction | Opportunity |
|---|---|---|---|---|
| **1. Discovery** | Find relevant tools | 😐 Skeptical | Generic marketing promises | Clear sample templates |
| **2. Setup** | Configure initial workspace | 😟 Overwhelmed | Blank canvas syndrome | Guided scaffolding |
| **3. Execution** | Draft strategy notes | 😊 Focused | Switching apps for guidelines | Docked reference drawer |
| **4. Handoff** | Share with stakeholders | 🤩 Confident | Clunky manual PDF exports | 1-Click portfolio view |

> 💡 **Moment of Truth:** The transition from Step 2 to 3 determines whether the user stays or abandons the platform.
`,

  ideation: `## 💡 Ideation & Concept Exploration

### How Might We (HMW) Questions
- **HMW #1:** How might we streamline documentation so it feels like thinking rather than reporting?
- **HMW #2:** How might we keep visual evidence tightly coupled to strategy notes?

### Explored Solution Directions
1. **Direction A (Minimalist):** Notion-style markdown with floating action pills.
2. **Direction B (Studio Split):** Resizable two-pane canvas with instant gallery view.
3. **Direction C (Interactive Timeline):** Visual node-based workflow.

### Selected Concept Rationale
> 🧪 **Hypothesis:** We selected **Direction B** because side-by-side strategy and visual evidence reduces context switching by over 60% in user testing.
`,

  userflow: `## 🔀 User Flow & Information Architecture

### Primary Flow Scope
[Define the exact journey: Start trigger $\\rightarrow$ Core decision nodes $\\rightarrow$ Happy path outcome]

### Key Decision Nodes
1. **Entry Point:** User opens workspace or project dashboard.
2. **Branching Logic:**
   - *If* new project: Trigger guided onboarding prompt.
   - *If* existing project: Restore active step and last scroll position.
3. **Completion Point:** Milestone verified and auto-saved.

### Edge Cases Handled
- [ ] Network disconnection during notes drafting (offline local sync)
- [ ] Invalid image format dropped into Evidence Vault (user-friendly toast alert)
- [ ] Empty state fallback with one-click starter scaffolds
`,

  wireframes: `## 📐 Low-Fidelity Wireframes & Structure

### Layout Architecture
- **Header:** Project identity, wayfinding progression track, and view modes.
- **Left Panel:** Macro-phase roadmap and project management.
- **Center Canvas:** Distraction-free Markdown editor.
- **Right Panel:** Evidence Vault & contextual methodology drawer.

### Key UX Decisions
- Placed progression bar horizontally at top to prevent vertical scrolling fatigue.
- Replaced modal dialogs with a dockable slide-out drawer to allow simultaneous reading and writing.

> 💡 **Design Constraint:** Keep critical controls within 1 click from any stage in the application.
`,

  ui: `## 🎨 UI Design System & Visual Hierarchy

### Design Language & Tone
- **Aesthetic:** Clean, utilitarian studio tool (Linear/Vercel inspired slate palette).
- **Primary Color:** High-contrast neutral slate-900 with strategic royal blue accents.
- **Typography:** Inter for clean readability; monospace for timestamps, counters, and metrics.

### Component Specifications
- **Button Standards:** High-contrast solid primaries with subtle border definitions.
- **Elevation:** Soft ambient drop shadows (\`shadow-xs\`, \`shadow-sm\`) to maintain modern depth without visual noise.
- **Transitions:** Snappy 150ms-200ms ease-out transitions for mode switching.
`,

  prototype: `## ⚡ Interactive Prototype & Micro-interactions

### Prototype Scope & Links
- **Prototype Link:** [Insert Figma / Framer preview URL here]
- **Target Devices:** Desktop Web (1440px viewport) & Tablet responsive.

### Key Interactive Flows Tested
1. Switching between Split, Editor Focus, and Gallery views.
2. Direct image paste and drag-and-drop into Evidence Vault.
3. Docking and undocking the Stage Methodology Guide.

> 💡 **Micro-interaction Detail:** Toast alerts and celebration chips self-dismiss within 2.8s without blocking interaction.
`,

  testing: `## 🧪 Usability Testing & Validation

### Test Setup
- **Format:** 5 Remote unmoderated usability sessions via screen-recording.
- **Core Tasks:**
  1. Create a new product design project.
  2. Draft problem framing notes and attach 2 mockup screenshots.
  3. Navigate to Case Study Export and review presentation output.

### Quantitative Results
| Task | Completion Rate | Avg. Time on Task | Friction Severity |
|---|---|---|---|
| 1. Project Setup | 100% | 42s | Low |
| 2. Strategy & Evidence | 90% | 2m 15s | Low |
| 3. Export Review | 100% | 35s | None |

### Critical Qualitative Feedback
> "Being able to see the methodology guidelines side-by-side while writing our rationale eliminated 3 browser tabs I usually keep open." — Senior Designer
`,

  iteration: `## 🔄 Iteration & Refinements

### Feedback Synthesis
Categorized user feedback from usability testing into immediate vs. post-launch backlog:

### High-Priority Adjustments Made
- [x] Added \`⌘B\` shortcut to quickly collapse the sidebar into an icon rail.
- [x] Added in-app Lightbox preview with zoom controls instead of relying on native browser popups.
- [x] Integrated rich markdown formatting toolbar with single-click callout inserts.

### Validated Improvements
- Post-iteration completion speed increased by 32%.
- Zero navigation confusion reported across all 4 Double Diamond phases.
`,

  casestudy: `## 🏆 Final Case Study Synthesis

### Project Impact & Outcome
- **Shipped Product:** UX Strategy & Process Documentation Studio
- **Business Impact:** Reduced product design documentation cycles from 3 days to under 4 hours.
- **Key Takeaway:** Structured macro-phases empower designers to tell a compelling, evidence-backed product story.
`
};
