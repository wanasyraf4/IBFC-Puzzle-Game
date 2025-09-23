import React, { useState, useEffect } from 'react';

interface CountdownProps {
  duration: number;
  onComplete: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ duration, onComplete }) => {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (count <= 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-slate-900/80 animate-fade-in backdrop-blur-sm">
      <div key={count} className="relative flex items-center justify-center">
        {/* Shockwave effect */}
        <div
            className="absolute w-64 h-64 rounded-full border-cyan-300"
            style={{
                animation: 'shockwave 0.95s ease-out forwards',
            }}
        />
        {/* Number */}
        <span
          className="text-9xl font-mono text-cyan-200"
          style={{
              textShadow: '0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff',
              animation: 'dramatic-countdown 0.95s ease-in-out forwards'
          }}>
          {count}
        </span>
      </div>
    </div>
  );
};

export default Countdown;
