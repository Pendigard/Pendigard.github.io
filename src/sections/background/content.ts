export interface BackgroundEvent {
  id: string;
  period: string;
  title: string;
  subtitles?: readonly string[];
  description: string;
  projectIds?: readonly string[];
  projectsTitle?: string;
}

export const experiences: BackgroundEvent[] = [
  { id: 'riken-aip', period: '2026', title: 'Reasearch Intern', subtitles: ['RIKEN AIP, Natural Language Understanding Team', 'Tohoku University, Sendai, Japan'], description: 'Investigated how LLMs represent source code through Sajaniemi\'s variable roles. Developed a static-analysis pipeline to extract 11 semantic variable roles from large-scale, multilingual codebases. Explored their internal representations through probing, sparse autoencoders (SAEs), controlled code edits, and generation interventions. Contributed to SharedSAE, a framework for learning a shared dictionary of interpretable sparse features across multiple model families.', projectIds: ['variable-roles', 'sharedsae'], projectsTitle: 'RIKEN AIP projects.' },
  { id: 'sogelink', period: '2024', title: 'Data Analyst Intern', subtitles: ['Sogelink', 'Lyon, France'], description: 'Developed an AWS-based data pipeline to process and analyze internal project-tracking data. Built a Power BI dashboard to support management reporting and decision-making, leveraging Python, SQL, S3, Athena, and Glue.' }
];

export const education: BackgroundEvent[] = [
  { id: 'masters', period: '2024 - Present', title: 'M.Sc. in Computer Science', subtitles: ['Sorbonne Université, Paris.'], description: 'Machine Learning, Artificial Intelligence & Data (MIND).', projectIds: ['mixture-of-memories', 'entity-typing', 'wikitableqa'], projectsTitle: "Master's projects." },
  { id: 'bachelors', period: '2021 - 2024', title: 'B.Sc. in Computer Science', subtitles: ['Université Claude Bernard Lyon 1.'], description: '', projectIds: ['tetris', 'dragon-quest-monsters'], projectsTitle: "Bachelor's projects." },
];

export const projectContexts = [...experiences, ...education]
  .filter((event) => event.projectIds?.length)
  .map((event) => ({ id: event.id, title: event.projectsTitle ?? `${event.title} projects.`, projectIds: event.projectIds! }));
