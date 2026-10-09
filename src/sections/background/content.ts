export interface BackgroundEvent {
  period: string;
  title: string;
  subtitles?: readonly string[];
  description: string;
}

export const experiences: BackgroundEvent[] = [
  { period: '2026', title: 'Reasearch Intern', subtitles: ['RIKEN AIP, Natural Language Understanding Team', 'Tohoku University, Sendai, Japan'], description: 'Investigated how LLMs represent source code through Sajaniemi\'s variable roles. Developed a static-analysis pipeline to extract 11 semantic variable roles from large-scale, multilingual codebases. Explored their internal representations through probing, sparse autoencoders (SAEs), controlled code edits, and generation interventions. Contributed to SharedSAE, a framework for learning a shared dictionary of interpretable sparse features across multiple model families.' },
  { period: '2024', title: 'Data Analyst Intern', subtitles: ['Sogelink', 'Lyon, France'], description: 'Developed an AWS-based data pipeline to process and analyze internal project-tracking data. Built a Power BI dashboard to support management reporting and decision-making, leveraging Python, SQL, S3, Athena, and Glue.' }
];

export const education: BackgroundEvent[] = [
  { period: '2024 - Present', title: 'M.Sc. in Computer Science', subtitles: ['Sorbonne Université, Paris.'], description: 'Machine Learning, Artificial Intelligence & Data (MIND).' },
  { period: '2021 - 2024', title: 'B.Sc. in Computer Science', subtitles: ['Université Claude Bernard Lyon 1.'], description: '' },
];
