/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect } from 'react';

// Passed OPTIONS should be in this format
// Weight is used to decide how likely that field will be landed on.
// Short Name is the label used on wheel

// const LEAGUES = [
//   { name: 'Premier League', color: '#38003c', shortName: 'EPL', weight: 7, icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
//   { name: 'Bundesliga', color: '#d20515', shortName: 'Bundesliga', weight: 7, icon: '🇩🇪' },
// ];

const SIZE = 450; // overall wheel diameter in px (was 300)
const SCALE = SIZE / 300;

const WheelComponent
 = ({ OPTIONS = [], setValue = () => {}, setCategory = () => {}  }) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const animationRef = useRef(null);

  // Calculate total weight and segment angles
  const totalWeight = OPTIONS.reduce((sum, option) => sum + option.weight, 0);
  const segments = OPTIONS.map((league, index) => {
    const startAngle = OPTIONS.slice(0, index).reduce((sum, opt) => sum + opt.weight, 0) * 360 / totalWeight;
    const endAngle = OPTIONS.slice(0, index + 1).reduce((sum, opt) => sum + opt.weight, 0) * 360 / totalWeight;
    return {
      ...league,
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2
    };
  });

  const createSegmentPath = (startAngle, endAngle) => {
    const radius = SIZE / 2;
    const centerX = SIZE / 2;
    const centerY = SIZE / 2;

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
        setValue(winningSegment)
        setCategory(winningSegment.name)
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
      <div style={{ position: 'relative', width: `${SIZE}px`, height: `${SIZE}px` }}>
        <div style={{
          position: 'absolute',
          top: `${-20 * SCALE}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: `${15 * SCALE}px solid transparent`,
          borderRight: `${15 * SCALE}px solid transparent`,
          borderTop: `${25 * SCALE}px solid #e74c3c`,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          zIndex: 20,
          pointerEvents: 'none'
        }} />

        {/* Wheel SVG */}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'none',
            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
          }}
        >
          <defs>
            <linearGradient
              id="usaGradient"
              gradientUnits="objectBoundingBox"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" style={{ stopColor: '#B22234', stopOpacity: 1 }} />
              <stop offset="33%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
              <stop offset="66%" style={{ stopColor: '#3C3B6E', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#B22234', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient
              id="goldGradient"
              gradientUnits="objectBoundingBox"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
              <stop offset="25%" style={{ stopColor: '#C0C0C0', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
              <stop offset="75%" style={{ stopColor: '#C0C0C0', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Outer border circle */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="#2c3e50" />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 5} fill="none" />

          {/* Segments */}
          {segments.map((segment, index) => (
            <g key={index}>
              <path
                d={createSegmentPath(segment.startAngle, segment.endAngle)}
                fill={
                  segment.shortName === 'MLS' ? 'url(#usaGradient)' :
                  segment.shortName === 'Legends' ? 'url(#goldGradient)' :
                  segment.color
                }
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="2"
              />
              {/* Text label with shadow effect */}
              <g>
                {/* Shadow */}
                <text
                  x={SIZE / 2}
                  y={SIZE / 2}
                  fill="rgba(0,0,0,0.5)"
                  fontSize={(segment.shortName === 'Legends' ? 11 : 14) * SCALE}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`
                    rotate(${segment.midAngle} ${SIZE / 2} ${SIZE / 2})
                    translate(0 ${-88 * SCALE})
                    rotate(90 ${SIZE / 2} ${SIZE / 2})
                  `}
                  style={{ pointerEvents: 'none' }}
                >
                  {segment.shortName}
                </text>
                {/* Main text */}
                <text
                  x={SIZE / 2}
                  y={SIZE / 2}
                  fill="white"
                  fontSize={(segment.shortName === 'Legends' ? 11 : 14) * SCALE}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`
                    rotate(${segment.midAngle} ${SIZE / 2} ${SIZE / 2})
                    translate(0 ${-90 * SCALE})
                    rotate(90 ${SIZE / 2} ${SIZE / 2})
                  `}
                  style={{ pointerEvents: 'none' }}
                >
                  {segment.shortName}
                </text>
              </g>
            </g>
          ))}

          {/* Center circle */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={30 * SCALE}
            fill="#2c3e50"
            stroke="white"
            strokeWidth={4 * SCALE}
            onClick={handleSpin}
            className="wheel-center"
          />
          <text
            onClick={handleSpin}
            x={SIZE / 2}
            y={SIZE / 2}
            fill="white"
            fontSize={12 * SCALE}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            className="wheel-center-text"
          >
            Spin
          </text>
        </svg>
      </div>

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

export default WheelComponent
;

WheelComponent.defaultProps = {
  OPTIONS: [],
};
