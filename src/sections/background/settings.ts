export const backgroundSettings = {
  eventsPerSlide: {
    experiences: 1,
    education: 2,
  },
  fontSize: {
    period: 'clamp(1rem, 1.45vw, 1.45rem)',
    title: 'clamp(1.4rem, 2.1vw, 2.3rem)',
    subtitle: 'clamp(1.05rem, 1.4vw, 1.4rem)',
    description: 'clamp(.95rem, 1.18vw, 1.18rem)',
    titleMobile: 'clamp(1.25rem, 5vw, 1.45rem)',
    subtitleMobile: 'clamp(.98rem, 4vw, 1.1rem)',
    descriptionMobile: 'clamp(.88rem, 3.7vw, 1rem)',
    partTitle: 'clamp(3rem, 4.8vw, 5.7rem)',
    partTitleMobile: 'clamp(1.7rem, 6.4vw, 2.6rem)',
  },
} as const;
