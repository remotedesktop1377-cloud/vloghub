export interface LanguageDirection {
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
}

// Languages that are written from right-to-left
const RTL_LANGUAGES = [
  'urdu',
  'arabic', 
  'persian',
  'sindhi',
  'pashto',
  'balochi',
  'hebrew'
];

/**
 * Determines if a language is written from right-to-left
 */
export const isRTLLanguage = (language: string): boolean => {
  return RTL_LANGUAGES.includes(language.toLowerCase());
};

/**
 * Gets direction properties for a given language
 */
export const getLanguageDirection = (language: string): LanguageDirection => {
  const isRTL = isRTLLanguage(language);
  
  return {
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left'
  };
};

/**
 * Gets Material-UI sx props for RTL/LTR text direction
 */
export const getDirectionSx = (language: string) => {
  const { direction, textAlign } = getLanguageDirection(language);
  
  return {
    direction,
    textAlign,
    '& *': {
      direction,
      textAlign: direction === 'rtl' ? 'right' : 'left'
    }
  };
};

/**
 * Gets CSS properties for RTL/LTR support
 */
export const getDirectionStyles = (language: string): React.CSSProperties => {
  const { direction, textAlign } = getLanguageDirection(language);
  
  return {
    direction,
    textAlign,
    unicodeBidi: 'bidi-override'
  };
};
