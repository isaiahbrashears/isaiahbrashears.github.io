/* eslint-disable react/prop-types */
import React from 'react';
import WheelComponent from '../../utils/WheelComponent';

const COLORS = [
 '#a40707', '#8c4f0d', '#a69923', '#0f5708', '#0b4972',
  '#49197d','#561642',
];

const singles = Array.from({ length: 30 }, (_, i) => {
  const num = i + 1;
  return { name: `#${num}`, shortName: `${num}` };
});

const ranges = Array.from({ length: 7 }, (_, i) => {
  const start = 31 + i * 10;
  const end = Math.min(start + 9, 99);
  return { name: `#${start}-${end}`, shortName: `${start}-${end}` };
});

const NUMBERS = [...singles, ...ranges].map((entry, i) => ({
  ...entry,
  color: COLORS[i % COLORS.length],
  weight: 1,
  icon: '',
}));

const NumberWheel = ({ setCurrentRule }) => {

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
     <WheelComponent OPTIONS={NUMBERS} setValue={setCurrentRule} />
    </div>
  );
};

export default NumberWheel;
