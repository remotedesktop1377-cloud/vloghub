// utils/buildImagePrompt.ts

/**
 * Extract key concepts from narration text to enhance image generation
 */
function extractKeywords(narration: string): string[] {
  const keywords: string[] = [];
  
  // Handle undefined/null narration
  if (!narration || typeof narration !== 'string') {
    return keywords;
  }
  
  const lowerText = narration.toLowerCase();
  
  // Countries and regions (for localization)
  const countries = ['pakistan', 'india', 'china', 'usa', 'america', 'britain', 'uk', 'france', 'germany', 'japan', 'south africa', 'nigeria', 'brazil', 'russia', 'turkey', 'iran', 'saudi arabia', 'uae', 'bangladesh', 'afghanistan'];
  const regions = ['asia', 'africa', 'europe', 'north america', 'south america', 'middle east', 'southeast asia', 'south asia'];
  
  // Economic and business terms
  const economicTerms = ['economy', 'economic', 'business', 'sme', 'smes', 'enterprise', 'enterprises', 'company', 'companies', 'industry', 'industries', 'market', 'trade', 'commerce', 'finance', 'financial', 'banking', 'investment', 'startup', 'entrepreneur'];
  
  // Infrastructure and utilities
  const infrastructureTerms = ['loadshedding', 'load shedding', 'electricity', 'power', 'energy', 'grid', 'blackout', 'outage', 'infrastructure', 'utilities', 'water', 'gas', 'internet', 'transportation'];
  
  // Emotional and descriptive terms
  const emotions = ['battle', 'struggle', 'challenge', 'crisis', 'problem', 'solution', 'success', 'failure', 'hope', 'despair', 'frustration', 'determination', 'resilience', 'innovation', 'growth', 'decline'];
  
  // Social and community terms
  const socialTerms = ['community', 'society', 'people', 'population', 'citizens', 'families', 'workers', 'employees', 'owners', 'managers', 'backbone', 'foundation', 'support'];
  
  // Professional and occupational terms
  const professionalTerms = ['professional', 'expert', 'specialist', 'worker', 'employee', 'manager', 'owner', 'entrepreneur', 'leader', 'team', 'staff', 'workforce'];
  
  // Time and frequency terms
  const timeTerms = ['daily', 'everyday', 'constant', 'frequent', 'regular', 'ongoing', 'persistent', 'continuous', 'routine'];
  
  // Technical and industry terms
  const technicalTerms = ['technology', 'digital', 'innovation', 'development', 'manufacturing', 'production', 'service', 'retail', 'agriculture', 'healthcare', 'education', 'construction'];
  
  // Create a comprehensive keyword mapping
  const keywordCategories = [
    { category: 'location', terms: [...countries, ...regions] },
    { category: 'economic', terms: economicTerms },
    { category: 'infrastructure', terms: infrastructureTerms },
    { category: 'emotional', terms: emotions },
    { category: 'social', terms: socialTerms },
    { category: 'professional', terms: professionalTerms },
    { category: 'temporal', terms: timeTerms },
    { category: 'technical', terms: technicalTerms }
  ];
  
  // Extract keywords from each category
  keywordCategories.forEach(({ category, terms }) => {
    terms.forEach(term => {
      if (lowerText.includes(term)) {
        keywords.push(term);
      }
    });
  });
  
  // Extract proper nouns (capitalized words that might be important)
  const words = narration.split(/\s+/);
  words.forEach(word => {
    // Look for capitalized words that might be important (countries, companies, etc.)
    if (word.length > 2 && /^[A-Z][a-z]+/.test(word) && !['The', 'This', 'That', 'These', 'Those', 'And', 'But', 'Or', 'So'].includes(word)) {
      keywords.push(word.toLowerCase());
    }
  });
  
  // Remove duplicates and return unique keywords
  return Array.from(new Set(keywords));
}

/**
 * Get appropriate art style based on content
 */
function getArtStyle(visual_guidance: string, narration: string): string {
  // Handle undefined/null values
  const safeVisualGuidance = visual_guidance || '';
  const safeNarration = narration || '';
  const combined = `${safeVisualGuidance} ${safeNarration}`.toLowerCase();
  
  if (combined.includes('archival') || combined.includes('historic') || combined.includes('documentary') || combined.includes('vintage')) {
    return 'photorealistic, documentary-style';
  }
  if (combined.includes('dramatic') || combined.includes('powerful') || combined.includes('intense')) {
    return 'cinematic, dramatic lighting';
  }
  if (combined.includes('peaceful') || combined.includes('calm') || combined.includes('serene') || combined.includes('inspiring')) {
    return 'soft, inspiring, natural lighting';
  }
  if (combined.includes('education') || combined.includes('academic') || combined.includes('professional') || combined.includes('corporate')) {
    return 'clean, professional, well-lit';
  }
  if (combined.includes('technology') || combined.includes('modern') || combined.includes('digital')) {
    return 'modern, sleek, high-tech';
  }
  
  return 'photorealistic, professional';
}

/**
 * Get mood and tone descriptors
 */
function getMoodTone(narration: string): string {
  // Handle undefined/null narration
  if (!narration || typeof narration !== 'string') {
    return 'professional, engaging';
  }
  
  const lowerText = narration.toLowerCase();
  const moods: string[] = [];
  
  if (lowerText.includes('inspire') || lowerText.includes('motivate') || lowerText.includes('encourage')) moods.push('inspiring');
  if (lowerText.includes('professional') || lowerText.includes('business') || lowerText.includes('corporate')) moods.push('professional');
  if (lowerText.includes('calm') || lowerText.includes('peaceful') || lowerText.includes('serene')) moods.push('peaceful');
  if (lowerText.includes('dynamic') || lowerText.includes('energetic') || lowerText.includes('active')) moods.push('dynamic');
  if (lowerText.includes('innovative') || lowerText.includes('creative') || lowerText.includes('modern')) moods.push('innovative');
  if (lowerText.includes('educational') || lowerText.includes('informative') || lowerText.includes('learning')) moods.push('educational');
  if (lowerText.includes('collaborative') || lowerText.includes('teamwork') || lowerText.includes('together')) moods.push('collaborative');
  
  return moods.length > 0 ? moods.join(', ') : 'professional, engaging';
}

/**
 * Enhanced image prompt builder with detailed, specific descriptions
 */
export function buildImagePrompt({
    title,
    chapterIdx,
    visual_guidance,
    on_screen_text,
    narration = ''
  }: {
    title: string;
    chapterIdx: number;
    visual_guidance: string;
    on_screen_text?: string;
    narration?: string;
  }) {
    // Handle undefined/null values
    const safeVisualGuidance = visual_guidance || 'professional imagery';
    const safeNarration = narration || '';
    
    // Extract key elements from narration
    const keywords = extractKeywords(safeNarration);
    const artStyle = getArtStyle(safeVisualGuidance, safeNarration);
    const moodTone = getMoodTone(safeNarration);
    
    // Build core subject and action from visual guidance and narration
    let coreSubject = '';
    let coreAction = '';
    let setting = '';
    
    // Determine subject based on keywords and context
    if (keywords.includes('sme') || keywords.includes('smes') || keywords.includes('enterprise')) {
      coreSubject = 'small and medium enterprise owners and workers';
    } else if (keywords.includes('business') || keywords.includes('entrepreneur')) {
      coreSubject = 'business professionals and entrepreneurs';
    } else if (keywords.includes('economy') || keywords.includes('economic')) {
      coreSubject = 'economic activities and business scenes';
    } else if (safeVisualGuidance.includes('people') || safeVisualGuidance.includes('crowd') || safeVisualGuidance.includes('group')) {
      coreSubject = 'a diverse group of people';
    } else if (safeVisualGuidance.includes('professional') || safeVisualGuidance.includes('expert') || safeVisualGuidance.includes('specialist')) {
      coreSubject = 'professional individuals or experts';
    } else if (safeVisualGuidance.includes('student') || safeNarration.includes('student') || safeVisualGuidance.includes('academic')) {
      coreSubject = 'students or academics';
    } else if (safeVisualGuidance.includes('leader') || safeNarration.includes('leader')) {
      coreSubject = 'leadership figures or influential people';
    } else if (safeVisualGuidance.includes('team') || safeNarration.includes('team')) {
      coreSubject = 'collaborative team members';
    } else {
      coreSubject = 'people engaged in meaningful activities';
    }
    
    // Determine action based on keywords and context
    if (keywords.includes('battle') || keywords.includes('struggle') || keywords.includes('challenge')) {
      coreAction = 'facing challenges and working to overcome difficulties';
    } else if (keywords.includes('loadshedding') || keywords.includes('power') || keywords.includes('electricity')) {
      coreAction = 'dealing with power outages and electrical challenges';
    } else if (keywords.includes('economy') || keywords.includes('business') || keywords.includes('enterprise')) {
      coreAction = 'conducting business operations and economic activities';
    } else if (keywords.includes('daily') || keywords.includes('routine') || keywords.includes('everyday')) {
      coreAction = 'engaged in daily operations and routine activities';
    } else if (safeNarration.includes('speak') || safeNarration.includes('present') || safeNarration.includes('address')) {
      coreAction = 'presenting or speaking';
    } else if (safeNarration.includes('work') || safeNarration.includes('collaborate')) {
      coreAction = 'working together or collaborating';
    } else if (safeNarration.includes('study') || safeNarration.includes('learn') || safeNarration.includes('research')) {
      coreAction = 'studying, learning, or researching';
    } else if (safeNarration.includes('create') || safeNarration.includes('build') || safeNarration.includes('develop')) {
      coreAction = 'creating or developing something';
    } else if (safeNarration.includes('demonstrate') || safeNarration.includes('show')) {
      coreAction = 'demonstrating or showcasing';
    } else {
      coreAction = 'engaged in meaningful activity';
    }
    
    // Determine setting based on keywords and context
    if (keywords.includes('pakistan')) {
      setting = 'in a Pakistani setting with recognizable cultural and architectural elements';
    } else if (keywords.includes('india') || keywords.includes('bangladesh') || keywords.includes('south asia')) {
      setting = 'in a South Asian setting with cultural context';
    } else if (keywords.includes('business') || keywords.includes('enterprise') || keywords.includes('sme')) {
      setting = 'in a small business or enterprise environment';
    } else if (keywords.includes('economy') || keywords.includes('economic')) {
      setting = 'in an economic or commercial district setting';
    } else if (keywords.includes('loadshedding') || keywords.includes('power') || keywords.includes('electricity')) {
      setting = 'with visible electrical infrastructure and power-related elements';
    } else if (safeVisualGuidance.includes('office') || safeVisualGuidance.includes('corporate') || safeVisualGuidance.includes('business')) {
      setting = 'in a professional office or business environment';
    } else if (safeVisualGuidance.includes('classroom') || safeVisualGuidance.includes('academic') || safeVisualGuidance.includes('educational')) {
      setting = 'in an educational or academic setting';
    } else if (safeVisualGuidance.includes('outdoor') || safeVisualGuidance.includes('public') || safeVisualGuidance.includes('street')) {
      setting = 'in an outdoor or public environment';
    } else if (safeVisualGuidance.includes('modern') || safeVisualGuidance.includes('contemporary')) {
      setting = 'in a modern, contemporary setting';
    } else if (safeVisualGuidance.includes('historic') || safeVisualGuidance.includes('traditional')) {
      setting = 'in a historic or traditional environment';
    } else {
      setting = 'in an appropriate contextual environment';
    }
    
    // Build enhanced prompt components
    const promptParts = [
      // Core subject and action
      `A ${artStyle} image of ${coreSubject} ${coreAction} ${setting}.`,
      
      // Specific visual details from guidance
      `Visual elements include: ${safeVisualGuidance}.`,
      
      // Mood and composition
      `The mood is ${moodTone}, with professional composition and broadcast quality.`,
      
      // Technical specifications
      `16:9 aspect ratio, high resolution, crisp details, appropriate lighting for the scene.`,
      
      // Content guidelines
      `No text overlay in the image. Focus on visual storytelling that supports the narrative themes and content.`
    ];
    
    // Add specific contextual enhancements based on extracted keywords
    if (keywords.includes('pakistan')) {
      promptParts.push('Include Pakistani cultural elements, architecture, and recognizable local context such as traditional clothing, local signage, or characteristic building styles.');
    }
    
    if (keywords.includes('loadshedding') || keywords.includes('power') || keywords.includes('electricity')) {
      promptParts.push('Include electrical infrastructure elements like power lines, transformers, generators, or UPS systems. Show the impact of power issues on daily life.');
    }
    
    if (keywords.includes('sme') || keywords.includes('smes') || keywords.includes('enterprise')) {
      promptParts.push('Focus on small business settings like local shops, small factories, workshops, or entrepreneurial activities. Show the scale appropriate for SMEs.');
    }
    
    if (keywords.includes('economy') || keywords.includes('economic')) {
      promptParts.push('Include economic indicators like charts, business districts, commercial activities, or market scenes that represent economic conditions.');
    }
    
    if (keywords.includes('battle') || keywords.includes('struggle') || keywords.includes('challenge')) {
      promptParts.push('Convey the sense of challenge and determination through expressions, body language, and environmental cues that suggest overcoming difficulties.');
    }
    
    if (keywords.includes('daily') || keywords.includes('everyday') || keywords.includes('routine')) {
      promptParts.push('Show routine business activities and everyday work scenarios that represent the regular operations of enterprises.');
    }
    
    if (keywords.includes('backbone') || keywords.includes('foundation') || keywords.includes('support')) {
      promptParts.push('Emphasize the foundational role and importance through visual metaphors of support, strength, and essential infrastructure.');
    }
    
    // Generic fallbacks for common terms
    if (keywords.includes('professional')) {
      promptParts.push('Include professional elements like modern workspace, business attire, or corporate environment.');
    }
    
    if (keywords.includes('student') || keywords.includes('educational')) {
      promptParts.push('Include educational elements like books, study materials, or academic settings.');
    }
    
    if (keywords.includes('innovative') || keywords.includes('creative')) {
      promptParts.push('Include modern, innovative elements that suggest creativity and forward-thinking.');
    }
    
    return promptParts.join(' ');
  }
  