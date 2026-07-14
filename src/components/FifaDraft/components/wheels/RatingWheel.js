/* eslint-disable react/prop-types */
import React from 'react';
import WheelComponent from '../../utils/WheelComponent';

const LEAGUES = [
  { name: '60 - 64', color: '#949090', shortName: '60 - 64', weight: 7, icon: '' },
  { name: '65 - 69', color: '#c5c2b5', shortName: '65 - 69', weight: 7, icon: '' },
  { name: '70 - 74', color: '#c3b976', shortName: '70 - 74', weight: 7, icon: '' },
  { name: '75 - 79', color: '#bfaf56', shortName: '75 - 79', weight: 7, icon: '' },
  { name: '80 - 84', color: '#c2ac3b', shortName: '80 - 84', weight: 7, icon: '' },
  { name: '85 - 89', color: '#a18c26', shortName: '85 - 89', weight: 7, icon: '' },
  { name: '90+', color: '#635923', shortName: '90+', weight: 7, icon: '' },
];

const RatingWheel = ({ setCurrentRule }) => {

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
     <WheelComponent OPTIONS={LEAGUES} setValue={setCurrentRule} />
    </div>
  );
};

export default RatingWheel;
