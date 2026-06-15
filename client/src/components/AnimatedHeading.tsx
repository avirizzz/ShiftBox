import { useEffect, useState } from 'react';

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  initialDelay?: number;
  charDelay?: number;
  duration?: number;
}

export default function AnimatedHeading({
  text,
  className = '',
  initialDelay = 200,
  charDelay = 30,
  duration = 500,
}: AnimatedHeadingProps) {
  const [startAnimation, setStartAnimation] = useState(false);
  // Support both actual newlines and literal '\n' strings
  const lines = text.split(/\n|\\n/);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartAnimation(true);
    }, initialDelay);
    return () => clearTimeout(timer);
  }, [initialDelay]);

  return (
    <h1 className={className} style={{ letterSpacing: '-0.04em' }}>
      {lines.map((line, lineIdx) => {
        const prevChars = lines.slice(0, lineIdx).reduce((sum, l) => sum + l.length, 0);
        return (
          <div key={lineIdx} className="overflow-hidden">
            {line.split('').map((char, charIdx) => {
              const globalCharIdx = prevChars + charIdx;
              const delayMs = globalCharIdx * charDelay;

              // Use a non-breaking space for actual spaces
              const displayChar = char === ' ' ? '\u00A0' : char;

              return (
                <span
                  key={charIdx}
                  className="inline-block transition-all"
                  style={{
                    opacity: startAnimation ? 1 : 0,
                    transform: startAnimation ? 'translateX(0)' : 'translateX(-18px)',
                    transitionDuration: `${duration}ms`,
                    transitionDelay: startAnimation ? `${delayMs}ms` : '0ms',
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)', 
                  }}
                >
                  {displayChar}
                </span>
              );
            })}
          </div>
        );
      })}
    </h1>
  );
}
