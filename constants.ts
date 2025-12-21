import { Template } from "./types";

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
}

export const STAGES: StageDef[] = [
  { 
    id: 'problem', 
    label: '1. Understand the Problem', 
    description: 'Define the core user problem, business goals, and success metrics.',
    help: 'What are we solving? Who is it for? Why does it matter now?',
    templateCategory: 'Strategy',
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
  }
];