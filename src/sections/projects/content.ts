export interface ProjectLink { label: string; href: string }

// These broad tags appear in the selector. Entries may also have more specific tags.
export const projectFilters = [
  'Machine Learning',
  'NLP',
  'Interpretability',
  'Data Engineering',
  'Software Engineering',
] as const;

export interface Project {
  slug: string;
  priority: number;
  title: string;
  description: string;
  context: string;
  technologies: readonly string[];
  skills: readonly string[];
  tags: readonly string[];
  destination: { kind: 'internal'; slug: string; label: string } | { kind: 'external'; href: string; label: string };
  secondaryLinks: readonly ProjectLink[];
  detail: readonly { heading: string; body: string }[];
}

// Project descriptions, roles and methods are adapted from Célian's supplied
// project list. External destinations are the supplied URLs, checked separately.
export const projects: readonly Project[] = [
  {
    slug: 'variable-roles', priority: 1,
    title: 'Do LMs Know What Variables Do? Interpreting Code Representations via Variable Roles',
    description: 'What do LLMs truly understand about the code they generate? Inspired by the psychology of programming, we investigated how LLMs represent Sajaniemi\'s variable roles. Built a large-scale, multilingual dataset of 1.74 million annotated variables using static program analysis. Investigated how programming concepts emerge in model representations through probing, sparse autoencoders, and controlled interventions, exploring the gap between recognizing code semantics and reliably controlling generation.',
    context: 'RIKEN AIP research internship',
    technologies: ['Python', 'Scala', 'Joern', 'PyTorch'],
    skills: ['Mechanistic interpretability', 'Static analysis', 'Causal interventions'],
    tags: ['Machine Learning', 'NLP', 'Interpretability', 'Data Engineering', 'Code Analysis', 'SAE'],
    destination: { kind: 'internal', slug: 'variable-roles', label: 'Project overview' },
    secondaryLinks: [{ label: 'Variable extractor · GitHub', href: 'https://github.com/Pendigard/sajaniemi-variable-extractor' }],
    detail: [
      { heading: 'Variable roles.', body: 'Inspired by the psychology of programming, this research uses Sajaniemi’s variable roles to ask what code language models represent about the variables in the programs they process.' },
      { heading: 'From labels to interventions.', body: 'A multilingual dataset of 1.74 million annotated variables was built with static program analysis. Probing, sparse autoencoders, and controlled interventions were used to study the gap between recognizing code semantics and controlling generation.' },
    ],
  },
  {
    slug: 'sharedsae', priority: 2,
    title: 'SharedSAE: One Feature Dictionary Across Language Models',
    description: 'Contributed to SharedSAE, a framework that learns a common sparse feature dictionary across multiple model families. Worked on semantic feature evaluation and model dropout, enabling cross-model interpretability and efficient single-model inference without requiring separate feature dictionaries for each model.',
    context: 'RIKEN AIP research internship',
    technologies: ['Python'],
    skills: ['Sparse autoencoders', 'Representation learning', 'Feature evaluation'],
    tags: ['Machine Learning', 'NLP', 'Interpretability', 'SAE'],
    destination: { kind: 'external', href: 'https://arxiv.org/abs/2609.04344', label: 'arXiv preprint' },
    secondaryLinks: [], detail: [],
  },
  {
    slug: 'mixture-of-memories', priority: 3,
    title: 'Mixture-of-Memories — Architecture Reimplementation',
    description: 'Reimplemented Mixture-of-Memories (ICLR 2025), an architecture combining memory routing with linear attention. Developed multiple implementations in PyTorch and Triton, including custom GPU kernels for linear attention and gated linear attention. Explored performance and memory-efficiency trade-offs, moving from a naive implementation toward a more hardware-efficient design.',
    context: 'M2 deep learning course project',
    technologies: ['Python', 'PyTorch', 'Triton'],
    skills: ['GPU programming', 'Linear attention', 'Performance evaluation'],
    tags: ['Machine Learning', 'Software Engineering', 'GPU Programming'],
    destination: { kind: 'external', href: 'https://github.com/Pendigard/MoM-paper-reimplementation', label: 'Project repository' },
    secondaryLinks: [], detail: [],
  },
  {
    slug: 'entity-typing', priority: 4,
    title: 'Knowledge Graph Entity Typing with Language Models',
    description: 'Extended SSET (NAACL 2024), a language-model-based approach to knowledge graph entity typing. Investigated why prediction performance deteriorates for entities associated with many types, and developed a targeted data augmentation strategy to improve their classification. Combined model experimentation and error analysis to address a specific limitation of the original approach.',
    context: 'M1 research project',
    technologies: ['Python', 'PyTorch'],
    skills: ['Knowledge graphs', 'Error analysis', 'Data augmentation'],
    tags: ['Machine Learning', 'NLP', 'Knowledge Graphs'],
    destination: { kind: 'internal', slug: 'entity-typing', label: 'Project overview' },
    secondaryLinks: [],
    detail: [
      { heading: 'Entity typing.', body: 'This M1 research project extended SSET, a language-model-based approach to assigning types to knowledge graph entities.' },
      { heading: 'A targeted limitation.', body: 'The work investigated why predictions deteriorate for entities associated with many types, then developed a targeted data augmentation strategy for their classification. It combined model experiments with error analysis.' },
    ],
  },
  {
    slug: 'wikitableqa', priority: 5,
    title: 'WikiTableQA — LLM-Powered Table Question Answering',
    description: 'Developed an end-to-end pipeline that transforms heterogeneous Wikipedia tables into queryable databases using LLM-assisted cleaning. Integrated Text-to-SQL generation to answer natural-language questions and built an evaluation framework to measure answer accuracy and analyze failure cases.',
    context: 'M2 research methodology course project',
    technologies: ['Python', 'Hugging Face Transformers', 'SQLite', 'SQL'],
    skills: ['Text-to-SQL', 'Data cleaning', 'Model evaluation'],
    tags: ['Machine Learning', 'NLP', 'Data Engineering', 'Information Retrieval'],
    destination: { kind: 'external', href: 'https://github.com/Armand394/QA_wiki_tables', label: 'Project repository' },
    secondaryLinks: [], detail: [],
  },
  {
    slug: 'rebjorn-wiki', priority: 6,
    title: 'Rebjørn Wiki — A Multilingual Game Database',
    description: 'Frustrated by the lack of a reliable, centralized resource for one of my favorite game series, I started building my own. Developed a multilingual wiki backed by a structured database, gathering and cleaning information from scattered online sources. Explored game files through reverse engineering to recover missing data and make it accessible through a unified website.',
    context: 'Personal project',
    technologies: ['Python', 'FastAPI', 'SQL'],
    skills: ['Data engineering', 'Database design', 'Reverse engineering'],
    tags: ['Data Engineering', 'Software Engineering', 'Web', 'Game Development'],
    destination: { kind: 'external', href: 'https://rebjorn-wiki.com/', label: 'Live website' },
    secondaryLinks: [], detail: [],
  },
  {
    slug: 'dragon-quest-mc', priority: 7,
    title: 'Dragon Quest MC — Minecraft Mod',
    description: 'Brought elements of the Dragon Quest universe into Minecraft by developing a custom mod in Java. Extended the game\'s existing systems with new creatures, items, and gameplay mechanics, working within the Minecraft Forge modding framework and adapting to an established, complex codebase.',
    context: 'Personal project',
    technologies: ['Java', 'Minecraft Forge', 'Gradle'],
    skills: ['Game modding', 'Object-oriented design', 'API integration'],
    tags: ['Software Engineering', 'Game Development'],
    destination: { kind: 'external', href: 'https://github.com/Pendigard/dragon-quest-minecraft', label: 'Project repository' },
    secondaryLinks: [], detail: [],
  },
  {
    slug: 'tetris', priority: 8,
    title: 'Tetris — Customizable Java Game',
    description: 'Built a Java Tetris game with single-player and competitive two-player modes. Designed a theming system for graphics and audio while keeping game logic and presentation modular.',
    context: 'Bachelor course project',
    technologies: ['Java', 'Swing', 'AWT'],
    skills: ['Object-oriented design', 'GUI development', 'Extensibility'],
    tags: ['Software Engineering', 'Game Development'],
    destination: { kind: 'external', href: 'https://github.com/Pendigard/Tetris', label: 'Project repository' },
    secondaryLinks: [], detail: [],
  },
  {
    slug: 'dragon-quest-monsters', priority: 9,
    title: 'Dragon Quest Monsters — 2D RPG in C++',
    description: 'Built a 2D monster-catching RPG with tile-based exploration, turn-based combat, collection, and team management. Implemented map loading, save files, and interactive menus in C++ and SDL2.',
    context: 'Bachelor course project',
    technologies: ['C++', 'SDL2', 'JSON'],
    skills: ['Game development', 'Graphics programming', 'Serialization'],
    tags: ['Software Engineering', 'Game Development'],
    destination: { kind: 'external', href: 'https://github.com/Pendigard/dragon-quest-monster-sdl', label: 'Project repository' },
    secondaryLinks: [], detail: [],
  },
];

// Explicit index keeps equal priorities in their authored order on every runtime.
export const orderedProjects = projects.map((project, index) => ({ project, index }))
  .sort((a, b) => a.project.priority - b.project.priority || a.index - b.index)
  .map(({ project }) => project);

export function projectHref(project: Project): string {
  return project.destination.kind === 'internal' ? `/projects/${project.destination.slug}/` : project.destination.href;
}
