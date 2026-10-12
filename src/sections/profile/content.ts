// Editorial copy for the four Profile slides. Keep presentation and interaction out of this file.
export const introduction = {
  title: 'Hi, I’m Célian.',
  paragraphs: [
    'I\'m a Master\'s student in Computer Science at Sorbonne Université, specializing in Machine Learning and AI. Passionate about languages and cross-lingual communication, I\'ve found in NLP a field that brings together my interests in linguistics and computer science.',
    'I’m curious about how language models learn and represent information. I hope to help deepen our understanding of these models and make AI more reliable and interpretable.',
  ],
  interests: ['Model Interpretability', 'Natural Language Processing', 'Multilingual Models', 'Machine Translation'],
} as const;

export const skillGroups = [
  { title: 'Programming Languages', lines: [{ items: 'Python · C/C++ · Java · JavaScript · OCaml · Prolog' }] },
  { title: 'Machine Learning & Deep Learning', lines: [
    { label: 'Skills', items: 'Model Training · Architecture Implementation · Transformers · Linear Attention · Model Evaluation' },
    { label: 'Tools', items: 'PyTorch · Hugging Face Transformers · scikit-learn · Triton · vLLM' },
  ] },
  { title: 'Interpretability', lines: [
    { label: 'Skills', items: 'Probing · Sparse Autoencoders · Representation Analysis · Causal Interventions' },
    { label: 'Tools', items: 'SAELens · TransformerLens · Neuronpedia' },
  ] },
  { title: 'Data & Knowledge Representation', lines: [
    { label: 'Data', items: 'SQL · PostgreSQL · pandas · Spark' },
    { label: 'Knowledge Graphs', items: 'Neo4j · Cypher · SPARQL · RDF · OWL' },
  ] },
  { title: 'Tools & Infrastructure', lines: [{ items: 'Git · AWS (S3, Athena, Glue)' }] },
] as const;

export const languages = [
  { name: 'French', level: 'Native', code: 'fr', original: 'Je parle français depuis ma tendre enfance.', translation: 'I have spoken French since early childhood.' },
  { name: 'English', level: 'C1', code: 'en', original: 'I speak and understand English at an academic level.' },
  { name: 'Japanese', level: 'B1', code: 'ja', original: '3年前に独学で日本語の勉強を始め、今も続けています。', translation: 'I started learning Japanese on my own three years ago and have kept at it ever since.' },
  { name: 'Spanish', level: 'B1', code: 'es', original: 'Estudié español durante la secundaria y el bachillerato.', translation: 'I studied Spanish throughout middle school and high school.' },
] as const;

export const hobbies = {
  interests: ['Photography', 'Programming', 'Travelling', 'Dragon Quest', 'Learning Languages'],
  sports: ['Basketball', 'Karate', 'Boxing', 'Bouldering', 'Skiing'],
} as const;
