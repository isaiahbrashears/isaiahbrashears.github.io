import React, { useState, useRef, useEffect } from 'react';

const LEAGUES = [
  { name: 'Premier League', color: '#38003c', shortName: 'EPL', weight: 7 },
  { name: 'La Liga', color: '#ee8707', shortName: 'La Liga', weight: 7 },
  { name: 'Bundesliga', color: '#d20515', shortName: 'Bundesliga', weight: 7 },
  { name: 'Serie A', color: '#024494', shortName: 'Serie A', weight: 7 },
  { name: 'Rest of the World', color: '#16a085', shortName: 'Rest of World', weight: 6 },
  { name: 'Legends', color: '#f39c12', shortName: 'Legends', weight: 1 } // Much smaller!
];

const WheelComponent = () => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const animationRef = useRef(null);

  // Calculate total weight and segment angles
  const totalWeight = LEAGUES.reduce((sum, league) => sum + league.weight, 0);
  const segments = LEAGUES.map((league, index) => {
    const startAngle = LEAGUES.slice(0, index).reduce((sum, l) => sum + l.weight, 0) * 360 / totalWeight;
    const endAngle = LEAGUES.slice(0, index + 1).reduce((sum, l) => sum + l.weight, 0) * 360 / totalWeight;
    return {
      ...league,
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2
    };
  });

  const createSegmentPath = (startAngle, endAngle) => {
    const radius = 150;
    const centerX = 150;
    const centerY = 150;

    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setWinner(null);

    // Random number of spins + random angle
    const spins = 5 + Math.random() * 3;
    const extraDegrees = Math.random() * 360;
    const totalRotation = rotation + (spins * 360) + extraDegrees;

    let start = null;
    const duration = 4000; // 4 seconds

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / duration, 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - percentage, 3);
      const currentRotation = rotation + (totalRotation - rotation) * easeOut;

      setRotation(currentRotation);

      if (percentage < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Determine winner
        const normalizedRotation = (360 - (currentRotation % 360)) % 360;
        const winningSegment = segments.find(seg =>
          normalizedRotation >= seg.startAngle && normalizedRotation < seg.endAngle
        );
        setWinner(winningSegment ? winningSegment.name : LEAGUES[0].name);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '500px',
      userSelect: 'none',
      gap: '30px',
      padding: '20px'
    }}>
      {/* Pointer */}
      <div style={{ position: 'relative', width: '300px', height: '300px' }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderTop: '25px solid #e74c3c',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          zIndex: 20,
          pointerEvents: 'none'
        }} />

        {/* Wheel SVG */}
        <svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'none',
            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
          }}
        >
          {/* Outer border circle */}
          <circle cx="150" cy="150" r="150" fill="#2c3e50" />
          <circle cx="150" cy="150" r="145" fill="none" />

          {/* Segments */}
          {segments.map((segment, index) => (
            <g key={index}>
              <path
                d={createSegmentPath(segment.startAngle, segment.endAngle)}
                fill={segment.color}
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="2"
              />
              {/* Text label with shadow effect */}
              <g>
                {/* Shadow */}
                <text
                  x="150"
                  y="150"
                  fill="rgba(0,0,0,0.5)"
                  fontSize={segment.shortName === 'Legends' ? '11' : '14'}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`
                    rotate(${segment.midAngle} 150 150)
                    translate(0 -88)
                  `}
                  style={{ pointerEvents: 'none' }}
                >
                  {segment.shortName}
                </text>
                {/* Main text */}
                <text
                  x="150"
                  y="150"
                  fill="white"
                  fontSize={segment.shortName === 'Legends' ? '11' : '14'}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`
                    rotate(${segment.midAngle} 150 150)
                    translate(0 -90)
                  `}
                  style={{ pointerEvents: 'none' }}
                >
                  {segment.shortName}
                </text>
              </g>
            </g>
          ))}

          {/* Center circle */}
          <circle cx="150" cy="150" r="30" fill="#2c3e50" stroke="white" strokeWidth="4" />
          <text
            x="150"
            y="150"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            SPIN
          </text>
        </svg>
      </div>

      {winner && (
        <div style={{
          padding: '20px 40px',
          background: winner === 'Legends'
            ? 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.5s ease-in'
        }}>
          {winner === 'Legends' ? '🏆✨ LEGENDS! ✨🏆' : `🎉 ${winner}! 🎉`}
        </div>
      )}

      <button
        onClick={handleSpin}
        disabled={isSpinning}
        style={{
          padding: '18px 50px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white',
          background: isSpinning
            ? 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
            : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
          border: 'none',
          borderRadius: '50px',
          cursor: isSpinning ? 'not-allowed' : 'pointer',
          boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
          transform: isSpinning ? 'scale(0.95)' : 'scale(1)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
        onMouseEnter={(e) => {
          if (!isSpinning) {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSpinning) {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
          }
        }}
      >
        {isSpinning ? '🎲 SPINNING...' : '🎯 SPIN THE WHEEL'}
      </button>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default WheelComponent;
