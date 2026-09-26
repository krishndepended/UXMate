import { Template, UXLaw, PerfectUserFlowPhase, MacroPhase } from "./types";

export interface GuideContent {
  why: string;
  bestPractices: string[];
  deliverables: string[];
}

export interface StageDef {
  id: string;
  label: string;
  description: string;
  help: string;
  templateCategory?: string;
  guide?: GuideContent;
  icon?: string; // Emoji or Icon name for the dashboard
}

export const STAGES: StageDef[] = [
  { 
    id: 'problem', 
    label: '1. Understand the Problem', 
    description: 'Define the core user problem, business goals, and success metrics.',
    help: 'What are we solving? Who is it for? Why does it matter now?',
    templateCategory: 'Strategy',
    icon: '🎯',
    guide: {
      why: "A well-defined problem is half-solved. Without clarity here, you risk designing a beautiful solution for a problem that doesn't exist.",
      bestPractices: [
        "Use the '5 Whys' technique to find the root cause.",
        "Differentiate between business needs and user needs.",
        "Avoid suggesting solutions in the problem statement."
      ],
      deliverables: ["Problem Statement", "Project Vision", "Success Metrics (KPIs)"]
    }
  },
  { 
    id: 'research', 
    label: '2. Research', 
    description: 'Conduct user interviews, competitive analysis, and surveys.',
    help: 'Gather qualitative and quantitative data to validate assumptions.',
    templateCategory: 'Research',
    icon: '🔍',
    guide: {
      why: "Research moves you from 'I think' to 'I know'. It builds empathy and ensures your design is grounded in reality.",
      bestPractices: [
        "Don't lead the witness—ask open-ended questions.",
        "Observe behavior, don't just listen to words.",
        "Analyze at least 3 direct and indirect competitors."
      ],
      deliverables: ["Interview Transcripts", "Competitive Audit", "Survey Results"]
    }
  },
  { 
    id: 'persona', 
    label: '3. Persona', 
    description: 'Synthesize research into user personas and empathy maps.',
    help: 'Create a representative character of your target audience.',
    templateCategory: 'Research',
    icon: '👥',
    guide: {
      why: "Personas serve as a 'North Star' for the team. They prevent 'self-referential design' where designers design for themselves.",
      bestPractices: [
        "Base personas on actual research data, not stereotypes.",
        "Focus on motivations and goals over demographic data (age/location).",
        "Keep them alive—refer to them by name in meetings."
      ],
      deliverables: ["User Personas", "Empathy Maps", "User Stories"]
    }
  },
  { 
    id: 'journey', 
    label: '4. Journey Map', 
    description: 'Map out the current and future state user journeys.',
    help: 'Identify pain points and opportunities across the user timeline.',
    templateCategory: 'Strategy',
    icon: '🗺️',
    guide: {
      why: "Journey maps visualize the highs and lows of an experience, helping you spot 'moments of truth' where a user is likely to drop off.",
      bestPractices: [
        "Capture thoughts and feelings, not just actions.",
        "Identify 'pain points' and 'delight moments'.",
        "Map the 'Current State' before the 'Future State'."
      ],
      deliverables: ["Current State Map", "Future State Vision", "Service Blueprint"]
    }
  },
  { 
    id: 'ideation', 
    label: '5. Sketches / Ideation', 
    description: 'Brainstorm diverse solutions and sketch rough ideas (Crazy 8s).',
    help: 'Focus on quantity over quality. Explore different approaches.',
    templateCategory: 'Design',
    icon: '💡',
    guide: {
      why: "Ideation is about divergent thinking. The first idea is rarely the best; sketching many options allows you to explore the edges of the problem space.",
      bestPractices: [
        "Quantity over quality at this stage.",
        "Defer judgment—don't shoot down ideas early.",
        "Use 'How Might We' questions to spark creativity."
      ],
      deliverables: ["Crazy 8s Sketches", "Brainstorming Notes", "Concept Posters"]
    }
  },
  { 
    id: 'userflow', 
    label: '6. User Flow / IA', 
    description: 'Define the information architecture, sitemap, and logical flows.',
    help: 'Map the path a user takes to complete a task.',
    templateCategory: 'Design',
    icon: '🔀',
    guide: {
      why: "Flows ensure the logic of the product is sound. Good IA makes a complex system feel intuitive and easy to navigate.",
      bestPractices: [
        "Think about 'edge cases' (errors, empty states).",
        "Ensure every flow has a clear entry and exit point.",
        "Keep the hierarchy shallow (ideally 3 clicks max)."
      ],
      deliverables: ["Sitemap", "User Flow Diagrams", "Logic Trees"]
    }
  },
  { 
    id: 'wireframes', 
    label: '7. Wireframes', 
    description: 'Create structural layouts (Low/Mid-Fi) focusing on functionality.',
    help: 'Layout content without getting distracted by colors or typography.',
    templateCategory: 'Design',
    icon: '📐',
    guide: {
      why: "Wireframes are the skeleton of your design. Removing color and images forces you to focus on usability, placement, and hierarchy.",
      bestPractices: [
        "Use real content where possible (no 'Lorem Ipsum').",
        "Focus on 'Call to Action' placement.",
        "Don't worry about pixel perfection yet."
      ],
      deliverables: ["Lo-Fi Paper Prototypes", "Mid-Fi Digital Wireframes"]
    }
  },
  { 
    id: 'ui_design', 
    label: '8. UI Design', 
    description: 'Apply visual systems, typography, colors, and branding (High-Fi).',
    help: 'Bring the interface to life with the design system.',
    templateCategory: 'Design',
    icon: '🎨',
    guide: {
      why: "Visual design isn't just decoration; it's communication. It establishes trust, brand identity, and guides attention through visual weight.",
      bestPractices: [
        "Maintain consistency with a Design System.",
        "Check accessibility (color contrast, tap targets).",
        "Follow platform guidelines (iOS vs. Android)."
      ],
      deliverables: ["High-Fi UI Screens", "Style Guide / Components"]
    }
  },
  { 
    id: 'prototype', 
    label: '9. Prototype', 
    description: 'Build interactive prototypes to simulate the final experience.',
    help: 'Link screens together to test interactions and transitions.',
    templateCategory: 'Testing',
    icon: '📱',
    guide: {
      why: "Prototypes bring designs to life. They allow you to test micro-interactions and the overall 'feel' before writing a single line of code.",
      bestPractices: [
        "Test only what you need to validate.",
        "Ensure transitions match the intended platform behavior.",
        "Make it look 'real enough' to get honest feedback."
      ],
      deliverables: ["Clickable Prototype", "Interactive Micro-animations"]
    }
  },
  { 
    id: 'testing', 
    label: '10. Usability Testing', 
    description: 'Test with real users, observe behavior, and gather feedback.',
    help: 'Validate your solution. Does it actually solve the problem?',
    templateCategory: 'Testing',
    icon: '🧪',
    guide: {
      why: "Usability testing is the moment of truth. It reveals where your assumptions failed and where users are getting stuck.",
      bestPractices: [
        "Test with at least 5 users to find 80% of issues.",
        "Give tasks, not instructions.",
        "Note the 'critical errors' vs. 'cosmetic issues'."
      ],
      deliverables: ["Test Plan", "Observation Notes", "Success Rate Data"]
    }
  },
  { 
    id: 'iteration', 
    label: '11. Iteration', 
    description: 'Refine and improve the design based on testing results.',
    help: 'What changes are needed based on user feedback?',
    templateCategory: 'Testing',
    icon: '♻️',
    guide: {
      why: "Design is never finished. Iteration is the process of closing the gap between your prototype and a perfect user experience.",
      bestPractices: [
        "Prioritize fixes based on impact vs. effort.",
        "Don't be afraid to scrap an idea if testing proved it wrong.",
        "Re-test critical changes if time permits."
      ],
      deliverables: ["Revised UI Designs", "Change Log", "Final Prototype"]
    }
  },
  { 
    id: 'casestudy', 
    label: '12. Case Study', 
    description: 'Compile your process into a portfolio-ready presentation.',
    help: 'Tell the story of your project from problem to solution.',
    templateCategory: 'Delivery',
    icon: '📄',
    guide: {
      why: "A case study isn't a gallery; it's a story. It proves you have a process and can solve complex business problems with design.",
      bestPractices: [
        "Lead with the 'After' to hook the reader.",
        "Explain the 'Why' behind major design decisions.",
        "Show reflections—what would you do differently?"
      ],
      deliverables: ["Portfolio Link", "PDF Case Study", "Presentation Deck"]
    }
  }
];

// Templates are now "frameworks" used by the guide
export interface RichTemplate extends Template {
  preview: string;
  example: string;
}

export const TEMPLATES: RichTemplate[] = [
  {
    key: 'problem',
    label: 'Problem Statement',
    category: 'Strategy',
    content: `### Problem Statement\n**Formula:** Users struggle with {{problem}} because {{rootCause}}.\n\n**Our Solution:** We will improve {{focusArea}} so that {{benefit}}.\n\n**Business Goal:** Increase {{metric}} by {{percentage}}.\n\n---`,
    preview: 'Users struggle with [Problem] because [Root Cause]...',
    example: '### Problem Statement\n**Formula:** Users struggle with finding saved recipes because the profile menu is hidden...'
  },
  {
    key: 'research_script',
    label: 'User Interview Script',
    category: 'Research',
    content: `### User Interview Script: {{topic}}\n**Goal:** Understand how users currently handle {{task}}.\n**Participant:** {{participantName}} | **Date:** {{date}}\n\n**1. Introduction**\n"Hi, I'm {{interviewerName}}. I'm trying to understand how people {{task}}."\n\n**2. Key Questions**\n- How often do you currently {{task}}?\n- What is the hardest part about it?\n\n---`,
    preview: '1. Intro. 2. Warm up. 3. Task walk-through...',
    example: '### User Interview Script: Grocery Shopping...'
  },
  {
    key: 'persona',
    label: 'Full Persona',
    category: 'Research',
    content: `### Persona: {{name}}\n**Role:** {{role}} | **Age:** {{age}}\n\n> "{{quote}}"\n\n**Bio**\n{{name}} is a {{role}} who values {{values}}.\n\n**Goals**\n- {{goal1}}\n- {{goal2}}\n\n**Frustrations**\n- {{painPoint1}}\n\n---`,
    preview: 'Name: [Name] | Quote: "I want to..."',
    example: '### Persona: Sarah...'
  },
  {
    key: 'perfect_user_flow',
    label: 'The Perfect User Flow Spec',
    category: 'Design',
    content: `### The Perfect User Flow Architecture: {{featureName}}
**Objective:** Guide {{targetPersona}} from entry to successful task completion with zero friction.

#### 1. Entry Point / Trigger
- **Source:** {{entrySource}} (e.g., Push Notification / Search / Homepage Banner)
- **User Intent:** {{userIntent}}

#### 2. Orientation & Context
- **Landing Screen:** {{landingScreen}}
- **Mental Model Alignment (Jakob's Law):** {{mentalModelCheck}}

#### 3. Core Action (Happy Path)
- **Primary Action (Hick's Law):** {{primaryAction}}
- **Key Hit Target (Fitts's Law):** Primary button placed in thumb zone (≥48px height)
- **Input Optimization (Postel's Law):** Auto-focus, forgiving format, clear placeholders

#### 4. Feedback & System State
- **Instant Response:** {{loadingFeedback}}
- **Validation:** Inline non-blocking validation, clear guidance

#### 5. Peak Moment & Delight (Peak-End Rule)
- **Success Event:** {{successEvent}}
- **Delight Element:** Affirmation animation, progress celebratory badge

#### 6. Retention / Off-Ramp / Next Logical Step
- **Follow-up Action:** {{nextStep}} (e.g., View summary, Export receipt, Share)
- **Lasting Impression:** Feeling of accomplishment and confidence

---`,
    preview: '1. Entry Trigger -> 2. Orientation -> 3. Core Action -> 4. Feedback -> 5. Delight -> 6. Off-ramp',
    example: '### The Perfect User Flow Architecture: 1-Click Grocery Checkout...'
  },
  {
    key: 'ux_laws_audit',
    label: 'Heuristic Usability Evaluation',
    category: 'Testing',
    content: `### Heuristic Usability Evaluation: {{screenOrFlow}}
**Evaluator:** {{evaluatorName}} | **Date:** {{date}}

| UX Heuristic | Evaluation Rule | Status | Improvement Action |
| :--- | :--- | :--- | :--- |
| **1. Target Ergonomics (Fitts)** | Click/tap targets ≥48px; thumb zone accessible | [PASS / FAIL] | {{fittsAction}} |
| **2. Decision Simplicity (Hick)** | Decision options limited; single primary CTA | [PASS / FAIL] | {{hicksAction}} |
| **3. Familiar Patterns (Jakob)** | Familiar conventions & expected design patterns | [PASS / FAIL] | {{jakobsAction}} |
| **4. Working Memory (Miller)** | Information chunked into 7±2 digestible groups | [PASS / FAIL] | {{millersAction}} |
| **5. Forgiving Inputs (Postel)** | Forgiving inputs, auto-save, graceful recovery | [PASS / FAIL] | {{postelsAction}} |
| **6. Milestone Delight (Peak-End)**| Rewarding peak moment & satisfying conclusion | [PASS / FAIL] | {{peakEndAction}} |
| **7. Aesthetic Usability** | Visual harmony, clean rhythm, high perceived quality | [PASS / FAIL] | {{aestheticAction}} |
| **8. Focal Isolation (Restorff)** | Primary action distinctly isolated & prominent | [PASS / FAIL] | {{isolationAction}} |

**Overall Usability Score:** {{compliancePercent}}%
**Key Priority Fix:** {{topPriorityFix}}

---`,
    preview: 'Comprehensive heuristic evaluation against ergonomics, cognitive load, and feedback...',
    example: '### Heuristic Usability Evaluation: Checkout Screen...'
  }
];

export const MACRO_PHASES: MacroPhase[] = [
  {
    id: 'discover',
    name: 'Phase 1: Discover & Empathize',
    shortName: 'Discover',
    description: 'Understand user pain points, uncover root causes, and build foundational empathy.',
    stageIds: ['problem', 'research', 'persona'],
    icon: '🧭',
    color: 'from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200'
  },
  {
    id: 'define',
    name: 'Phase 2: Define & Architect',
    shortName: 'Define',
    description: 'Structure information architecture, map journeys, and craft the perfect user flow.',
    stageIds: ['journey', 'ideation', 'userflow'],
    icon: '📐',
    color: 'from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200'
  },
  {
    id: 'design',
    name: 'Phase 3: Design & Prototype',
    shortName: 'Design',
    description: 'Create low-fidelity wireframes, apply UI design systems, and build interactive flows.',
    stageIds: ['wireframes', 'ui_design', 'prototype'],
    icon: '🎨',
    color: 'from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-200'
  },
  {
    id: 'deliver',
    name: 'Phase 4: Test & Deliver',
    shortName: 'Deliver',
    description: 'Run usability tests, iterate with real user feedback, and export a polished case study.',
    stageIds: ['testing', 'iteration', 'casestudy'],
    icon: '🚀',
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-200'
  }
];

export const UX_LAWS: UXLaw[] = [
  {
    id: 'fitts',
    name: "Fitts's Law",
    subtitle: 'Target Size & Acquisition Distance',
    rule: 'The time to acquire a target is a function of the distance to and size of the target.',
    summary: 'Make critical interactive elements large, easy to hit, and placed within natural reach zones (especially mobile thumb zones).',
    icon: '🎯',
    category: 'Ergonomics',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    formula: 'Time = a + b * log2(2D / W)',
    keyPractices: [
      'Touch targets should be at least 44x44px (ideally 48x48px on mobile).',
      'Position primary CTA buttons along the bottom edge or within easy thumb reach.',
      'Pin important actions (sticky header/footer) so users never have to travel far.',
      'Group related buttons close together to minimize cursor/thumb travel distance.'
    ],
    auditChecklist: [
      'Are interactive touch targets at least 44x44px with comfortable padding?',
      'Is the primary call-to-action placed within easy reach of the thumb zone?',
      'Are destructive or secondary actions kept sufficiently spaced to prevent accidental clicks?',
      'Are frequently used controls pinned or easily accessible without long scrolls?'
    ],
    templateSnippet: `#### Fitts's Law Evaluation
- **Target Dimensions:** Primary CTA is minimum 48px height with 16px horizontal padding.
- **Reachability:** Positioned in bottom-pinned thumb zone for mobile and centered in natural viewport for desktop.
- **Click Accuracy:** Zero overlapping hit areas; 12px minimum spacing between adjacent tap targets.`
  },
  {
    id: 'hick',
    name: "Hick's Law",
    subtitle: 'Choice Reduction & Cognitive Load',
    rule: 'The time it takes to make a decision increases logarithmically with the number and complexity of choices.',
    summary: 'Simplify choices by breaking complex tasks into bite-sized steps and highlighting one clear default recommendation.',
    icon: '⚡',
    category: 'Cognition',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    formula: 'Time = b * log2(n + 1)',
    keyPractices: [
      'Limit main menu items and navigation options to 5 or fewer.',
      'Use progressive disclosure: reveal advanced settings only when explicitly needed.',
      'Provide smart default selections to bypass decision fatigue.',
      'Break multi-field checkout/registration processes into discrete, stepped wizards.'
    ],
    auditChecklist: [
      'Is there one unequivocal primary action per screen?',
      'Have non-essential choices been hidden behind progressive disclosure?',
      'Are sensible defaults pre-selected to minimize user cognitive strain?',
      'Is complex decision-making broken down into sequential steps?'
    ],
    templateSnippet: `#### Hick's Law Optimization
- **Options Reduction:** Reduced navigation choices from {{prevCount}} to {{newCount}} core actions.
- **Progressive Disclosure:** Advanced settings are tucked behind an expandable panel.
- **Default Selection:** Pre-populated recommended option saves users 3 decision steps.`
  },
  {
    id: 'jakob',
    name: "Jakob's Law",
    subtitle: 'Familiar Mental Models & Conventions',
    rule: 'Users spend most of their time on other sites, so they prefer your product to work like the ones they already know.',
    summary: 'Adopt familiar industry patterns and mental models so users can focus on their goals without learning a new paradigm.',
    icon: '🧭',
    category: 'Mental Models',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    keyPractices: [
      'Use standard icons with universally recognized meanings (search magnifying glass, shopping cart, trash bin).',
      'Follow platform navigation conventions (tabs on iOS, bottom navigation or standard sidebars).',
      'Position search bar, user profile, and notifications where users expect them.',
      'Support standard keyboard shortcuts (Cmd+S to save, Esc to exit, Cmd+Z to undo).'
    ],
    auditChecklist: [
      'Do iconography and controls match universal web and mobile conventions?',
      'Is the overall information architecture predictable based on industry standards?',
      'Are search, user profile, and navigation located in familiar standard zones?',
      'Does the user interface behave predictably without unannounced surprises?'
    ],
    templateSnippet: `#### Jakob's Law Alignment
- **Conventions Used:** Standard search bar in top navigation, familiar cart drawer, standard modal behavior.
- **Mental Model:** Flow mirrors industry standards so first-time users can navigate with zero onboarding friction.
- **Familiar Semantics:** Standard iconography and language ('Save', 'Export', 'Cancel') used throughout.`
  },
  {
    id: 'miller',
    name: "Miller's Law",
    subtitle: 'Information Chunking & Working Memory',
    rule: 'The average person can only keep 7 (plus or minus 2) items in their active working memory.',
    summary: 'Chunk complex information into 3 to 5 digestible clusters to prevent cognitive overload and enhance recall.',
    icon: '🧩',
    category: 'Cognition',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    formula: 'Capacity = 7 ± 2 items',
    keyPractices: [
      'Group long lists into distinct categories with clear headers.',
      'Format numbers and text into chunks (e.g., phone numbers: (555) 123-4567, credit cards: 4-4-4-4).',
      'Organize dashboard widgets and stats into 3 to 5 visual card containers.',
      'Chunk multi-step processes into 3 to 4 distinct phases.'
    ],
    auditChecklist: [
      'Is content chunked into logical units of 3 to 5 items rather than monolithic walls of data?',
      'Are phone numbers, dates, IDs, and complex numbers partitioned with clear formatting?',
      'Are related actions grouped together inside distinct card containers?',
      'Does each visual hierarchy level contain fewer than 7 distinct competing elements?'
    ],
    templateSnippet: `#### Miller's Law Chunking Strategy
- **Information Partitioning:** Split dense content into {{chunkCount}} distinct cards (≤5 items per card).
- **Formatted Data:** Inputs automatically format into readable segments with visual spacing.
- **Phase Grouping:** Grouped 12 stages into 4 macro-phases to keep working memory clear.`
  },
  {
    id: 'postel',
    name: "Postel's Law (Robustness Principle)",
    subtitle: 'Liberal Input Acceptance & Conservative Output',
    rule: 'Be liberal in what you accept, and conservative in what you send.',
    summary: 'Accept diverse user inputs graciously, accommodate human error, provide forgiving fallbacks, and output clean, predictable results.',
    icon: '🛡️',
    category: 'Ergonomics',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    keyPractices: [
      'Auto-format inputs automatically (strip out spaces, dashes, or punctuation gracefully).',
      'Provide robust undo mechanisms rather than harsh confirmation barriers for everyday actions.',
      'Support multiple input modalities (e.g. drag & drop, file picker, clipboard paste).',
      'Show clear, helpful recovery guidance instead of cryptic error codes.'
    ],
    auditChecklist: [
      'Does the application accept flexible input formats without throwing pedantic errors?',
      'Are nondestructive actions immediately reversible with an undo option?',
      'Is user work continuously auto-saved with transparent status feedback?',
      'Do error states explain exactly how to fix the problem in human-friendly language?'
    ],
    templateSnippet: `#### Postel's Law Forgiving Design
- **Input Flexibility:** Accepts clipboard paste, drag-and-drop, and raw text with smart sanitization.
- **Safety Nets:** Automatic background debounced saving + instant undo capability for destructive actions.
- **Error Recovery:** Forgiving input validation guides users forward without losing entered content.`
  },
  {
    id: 'peak_end',
    name: "Peak-End Rule",
    subtitle: 'Emotional Climax & Memorable Finish',
    rule: 'People judge an experience largely based on how they felt at its peak (most intense point) and at its end.',
    summary: 'Design deliberate moments of celebration at key milestones and ensure the exit experience leaves an empowering lasting impression.',
    icon: '🎉',
    category: 'Delight',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    keyPractices: [
      'Celebrate major milestone completions with rewarding micro-interactions (confetti, badges, encouraging praise).',
      'Design an exceptional finale screen (e.g., case study export studio, purchase confirmation with next steps).',
      'Turn potential low points (empty states, errors, 404s) into charming, helpful recovery moments.',
      'Conclude user flows with an empowering summary of what was accomplished.'
    ],
    auditChecklist: [
      'Is there an emotionally rewarding "peak" moment when completing key tasks?',
      'Does the final screen/step leave the user feeling accomplished and confident?',
      'Are empty states and waiting screens designed to feel pleasant rather than frustrating?',
      'Does the post-completion flow provide clear value delivery and off-ramp options?'
    ],
    templateSnippet: `#### Peak-End Experience Design
- **The Peak:** High-delight celebration when milestone is verified, accompanied by milestone verification badge.
- **The End:** Executive-grade Case Study export with instant printable PDF and rich HTML preview.
- **Emotional Impact:** User leaves feeling accomplished with a concrete portfolio deliverable.`
  },
  {
    id: 'aesthetic',
    name: "Aesthetic-Usability Effect",
    subtitle: 'Perceived Usability of Beautiful Design',
    rule: 'Users often perceive aesthetically pleasing design as design that is more usable.',
    summary: 'An attractive, polished interface fosters positive emotional trust, increases patience, and masks minor usability friction.',
    icon: '✨',
    category: 'Delight',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    keyPractices: [
      'Maintain strict typographic hierarchy, consistent line-heights, and proportional scales.',
      'Use a cohesive, intentional color system with purposeful contrast ratios (WCAG AA compliant).',
      'Apply subtle micro-interactions, smooth hover transitions, and rounded card elevations.',
      'Ensure generous, breathing whitespace so content never feels cramped or overwhelming.'
    ],
    auditChecklist: [
      'Is there a clean typographic scale with clear visual hierarchy from H1 down to caption?',
      'Are margins, padding, and alignments disciplined according to an 8pt/4pt grid system?',
      'Does the color palette communicate meaning consistently across states?',
      'Do micro-interactions and transitions feel responsive, fluid, and intentional?'
    ],
    templateSnippet: `#### Aesthetic-Usability Polish
- **Visual Discipline:** Built on an 8pt grid with balanced whitespace and clamp typography.
- **Design Tokens:** Modern slate foundation paired with vibrant accent cues for active states.
- **Micro-Interactions:** 400ms cubic-bezier transitions on hover, focus, and state changes.`
  },
  {
    id: 'von_restorff',
    name: "Von Restorff Effect",
    subtitle: 'Isolation Effect & Visual Contrast',
    rule: 'When multiple similar objects are present, the one that differs from the rest is most likely to be remembered.',
    summary: 'Make primary calls-to-action, active states, and critical alerts visually distinctive from all surrounding elements.',
    icon: '💡',
    category: 'Cognition',
    color: 'bg-amber-50 text-amber-800 border-amber-300',
    keyPractices: [
      'Ensure the primary CTA is visibly distinct from all secondary and ghost buttons on the screen.',
      'Use isolation (distinct color, glow, scale) to indicate the current active step in a workflow.',
      'Highlight recommended or most popular options in comparison tables.',
      'Keep visually isolated elements scarce—if everything is highlighted, nothing is.'
    ],
    auditChecklist: [
      'Is the single primary CTA immediately noticeable within 3 seconds of scanning the page?',
      'Does the active state stand out clearly against all inactive list items?',
      'Are important notifications or status pills differentiated with high contrast?',
      'Is the isolation effect used sparingly to avoid visual noise?'
    ],
    templateSnippet: `#### Von Restorff Isolation Analysis
- **Primary CTA:** High-contrast solid dark button with shadow-fab stands out against light background.
- **Active State:** Current active stage is isolated with a deep contrast badge and glowing outline.
- **Visual Hierarchy:** Recommended options use badge callouts to draw immediate visual attention.`
  }
];

export const PERFECT_USER_FLOW_PHASES: PerfectUserFlowPhase[] = [
  {
    id: 'entry',
    phaseNumber: 1,
    name: '1. Entry Point / Trigger',
    icon: '🚀',
    description: 'The catalyst that brings the user into this specific task or screen.',
    uxLawConnection: "Jakob's Law (Match external expectations & familiar entry triggers)",
    questions: [
      'Where did the user come from? (Search, Email, Push Notification, Home Screen)',
      'What expectation was set before arriving at this screen?',
      'Is the transition smooth with zero initial friction?'
    ],
    checklist: [
      'Context from preceding screen/trigger is preserved seamlessly',
      'User is not forced to log in or configure settings unless strictly required',
      'The initial value proposition is immediately visible within 3 seconds'
    ],
    defaultTemplate: `**Trigger:** User clicks "{{triggerSource}}"\n**User Mindset:** Expecting to {{expectedOutcome}} quickly with minimal steps.`
  },
  {
    id: 'orientation',
    phaseNumber: 2,
    name: '2. Orientation & Context',
    icon: '🧭',
    description: 'Answering: Where am I? What can I do here? Why does this matter?',
    uxLawConnection: "Hick's Law & Jakob's Law (Familiar layout, clear orientation, zero confusion)",
    questions: [
      'Does the screen immediately make sense without requiring an explanation?',
      'Is the primary purpose obvious at a single glance?',
      'Are breadcrumbs or progress indicators visible?'
    ],
    checklist: [
      'Clear, descriptive header and subtitle orienting the user',
      'Visible step/progress indicator (e.g. "Step 2 of 4")',
      'Familiar conventions used for navigation, close/back controls, and search'
    ],
    defaultTemplate: `**Screen:** {{screenName}}\n**Orientation Hook:** Clear heading '{{headline}}' with progress indicator (Step {{stepNum}} of {{totalSteps}}).`
  },
  {
    id: 'core_action',
    phaseNumber: 3,
    name: '3. Core Action (Happy Path)',
    icon: '⚡',
    description: 'The single most important action the user came to accomplish.',
    uxLawConnection: "Fitts's Law & Hick's Law (Large touch targets, zero distraction, single primary focus)",
    questions: [
      'What is the single primary task on this screen?',
      'Is the primary CTA button prominent, large (≥48px), and in easy reach?',
      'Have non-essential secondary choices been removed or minimized?'
    ],
    checklist: [
      'One dominant call-to-action button with high visual contrast (Von Restorff Effect)',
      'Touch target meets Fitts Law minimums (≥48px height, generous hit area)',
      'Inputs provide forgiving auto-focus and smart defaults (Postel Law)'
    ],
    defaultTemplate: `**Primary Action:** Click '{{ctaLabel}}'\n**Hit Target:** {{ctaSize}} button placed in primary thumb zone\n**Friction Prevention:** All non-essential fields deferred.`
  },
  {
    id: 'feedback',
    phaseNumber: 4,
    name: '4. Feedback & System State',
    icon: '🔄',
    description: 'Immediate confirmation that the system received the action and what is happening next.',
    uxLawConnection: "Postel's Law & Miller's Law (Live status, reassuring feedback, clear recovery)",
    questions: [
      'Does the user receive immediate feedback within 100ms of clicking/tapping?',
      'Are loading states, progress bars, or optimistic UI updates shown?',
      'Can errors be recovered gracefully without losing typed work?'
    ],
    checklist: [
      'Immediate button state change (syncing, spinner, or optimistic update)',
      'Human-readable inline validation messages (no cryptic error codes)',
      'Drafts or inputs are automatically saved continuously in background'
    ],
    defaultTemplate: `**Feedback Mechanism:** Immediate visual feedback ('{{statusText}}') with spinner\n**Error Boundary:** Inline recovery guidance with auto-saved drafts.`
  },
  {
    id: 'peak_delight',
    phaseNumber: 5,
    name: '5. Peak Moment & Delight',
    icon: '🎉',
    description: 'The emotional high point of the user flow celebrating success.',
    uxLawConnection: "Peak-End Rule (Elevated positive emotion at milestone completion)",
    questions: [
      'How does the user know the core task succeeded?',
      'Is there a celebratory touch (animation, badge, congratulatory message)?',
      'Does the user feel capable, accomplished, and relieved?'
    ],
    checklist: [
      'Clear success state or celebratory confirmation screen',
      'Affirming, positive micro-copy that reinforces the value delivered',
      'Tangible proof of completion (receipt, milestone checkmark, badge)'
    ],
    defaultTemplate: `**Success Milestone:** '{{milestoneTitle}}'\n**Delight Touch:** Celebratory micro-interaction + affirmative summary badge.`
  },
  {
    id: 'retention',
    phaseNumber: 6,
    name: '6. Retention / Off-Ramp / Next Step',
    icon: '🏁',
    description: 'What happens next? Smooth departure or logical continuation without a dead end.',
    uxLawConnection: "Peak-End Rule (Lasting favorable impression, empowering off-ramp)",
    questions: [
      'Where does the user go after completing the core task?',
      'Are there logical next actions (Share, Export, Return to Home)?',
      'Is there an exit or close button that feels natural?'
    ],
    checklist: [
      'No dead ends: always provide a primary next step or return path',
      'Offer share, download, or review actions while intent is high',
      'User leaves feeling empowered, eager to return'
    ],
    defaultTemplate: `**Next Step:** Direct link to '{{nextDestination}}' (or Export / Share options)\n**Off-ramp:** Clean transition back to dashboard with updated project state.`
  }
];
