export interface Chapter {
  id: string;
  heading: string;
  narration: string;
  visuals: string;
  brollIdeas: string[];
  duration: string;
}

export const mockChapters: Chapter[] = [
  {
    id: '1',
    heading: 'Opening: Why Mandela Matters Here',
    narration: "Introduce Nelson Mandela's global legacy and set up why his struggle resonates in Pakistan's context of social justice and anti-oppression.",
    visuals: 'Archival footage vibes, Pakistan cityscapes, crowd shots',
    brollIdeas: ['Historic protests', 'Flag transitions', 'Crowd silhouettes'],
    duration: '0:30'
  },
  {
    id: '2',
    heading: 'Parallels in Oppression',
    narration: 'Draw parallels between apartheid-era South Africa and episodes of discrimination and oppression experienced in parts of Pakistan.',
    visuals: 'Split-screen comparisons, newspapers, documentary textures',
    brollIdeas: ['Old newspapers', 'Streets and fences', 'Close-ups of faces'],
    duration: '0:45'
  },
  {
    id: '3',
    heading: 'Student and Civil Activism',
    narration: 'Explore how Mandela inspired student groups, lawyers, and civil society to organize around rights-based movements in Pakistan.',
    visuals: 'Campus shots, legal libraries, peaceful rallies',
    brollIdeas: ['Debate circles', 'Placards', 'Books and notes'],
    duration: '0:50'
  },
  {
    id: '4',
    heading: 'Media and Cultural Echoes',
    narration: "Highlight media references, school essays, and cultural tributes that kept Mandela's message alive across generations.",
    visuals: 'TV screens, classrooms, cultural events',
    brollIdeas: ['TV flicker overlay', 'Blackboard writing', 'Clapping audience'],
    duration: '0:40'
  },
  {
    id: '5',
    heading: 'Policy Lessons and Reforms',
    narration: "Discuss how Mandela's reconciliation-driven approach informs Pakistan's own reform and inclusion debates.",
    visuals: 'Parliament textures, bridges, hopeful faces',
    brollIdeas: ['Handshake close-ups', 'Bridges at sunrise', 'Notebooks'],
    duration: '0:45'
  },
  {
    id: '6',
    heading: 'Closing: A Shared Moral Imagination',
    narration: "Conclude by showing how Mandela's legacy continues to inspire activism, empathy, and democratic imagination in Pakistan.",
    visuals: 'Montage of faces, flags, and rising light',
    brollIdeas: ['Smiles', 'Children waving flags', 'Dawn light'],
    duration: '0:30'
  }
]; 