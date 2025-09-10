import React from 'react';

interface Props {
  text: string;
  keywords: string[];
}

export const TextWithHighlights: React.FC<Props> = ({ text, keywords }) => {
  if (!text || !keywords || keywords.length === 0) {
    return <>{text}</>;
  }

  const nonEmptyKeywords = keywords
    .map(k => k.trim())
    .filter(k => k.length > 0);

  if (nonEmptyKeywords.length === 0) {
    return <>{text}</>;
  }

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const pattern = nonEmptyKeywords
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');

  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, idx) => {
        const isMatch = nonEmptyKeywords.some(k => k.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <span
              key={idx}
              style={{
                backgroundColor: 'rgba(255, 220, 40, 0.6)',
                borderRadius: 3,
                padding: '0 2px'
              }}
              data-highlighted="true"
            >
              {part}
            </span>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
};

export default TextWithHighlights;


