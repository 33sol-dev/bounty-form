import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const TypewriterText = ({ text, onComplete }: any) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, 150); // Adjust typing speed here

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <span className="font-mono text-2xl font-bold">
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

function FormLoader() {
  const [showTypewriter, setShowTypewriter] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTypewriter(true);
    }, 1500); // Show typewriter after 1.5s

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen p-4 bg-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
        <p className="text-gray-600">Loading form...</p>
        {showTypewriter && (
          <div className="mt-4">
            <TypewriterText text="Hunt Bounty" onComplete={undefined} />
          </div>
        )}
      </div>
    </div>
  );
}

export default FormLoader;