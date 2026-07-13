import React from 'react';
import WheelComponent from '../../utils/WheelComponent';

const CATEGORIES = [
  { name: 'Nationality', color: '#38003c', shortName: 'Nationality', weight: 7, icon: '' },
  { name: 'League', color: '#D3AF37', shortName: 'League', weight: 7, icon: '' },
];

const CategoryWheel = ({ setCurrentCategory }) => {

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
     <WheelComponent OPTIONS={CATEGORIES} setCategory={setCurrentCategory} />
    </div>
  );
};

export default CategoryWheel;
