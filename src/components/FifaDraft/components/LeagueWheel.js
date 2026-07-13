import React from 'react';
import WheelComponent from '../utils/WheelComponent';

const LEAGUES = [
  { name: 'English Premier League', color: '#38003c', shortName: 'EPL', weight: 7, icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Legends', color: '#D3AF37', shortName: 'Legends', weight: 1, icon: '🏆✨' },
  { name: 'French Ligue 1', color: '#0055A4', shortName: 'Ligue 1', weight: 7, icon: '🇫🇷' },
  { name: 'La Liga', color: '#ee8707', shortName: 'La Liga', weight: 7, icon: '🇪🇸' },
  { name: 'MLS', color: '#B22234', shortName: 'MLS', weight: 1, icon: '🇺🇸' },
  { name: 'Brasileiro Série A', color: '#0c6b24', shortName: 'B Serie A', weight: 7, icon: '🇧🇷' },
  { name: 'Bundesliga', color: '#d20515', shortName: 'Bundesliga', weight: 7, icon: '🇩🇪' },
  { name: 'Rest of the World', color: '#000', shortName: 'Rest of World', weight: 1, icon: '🌍' },
  { name: 'Italy Serie A', color: '#024494', shortName: 'I Serie A', weight: 7, icon: '🇮🇹' },
];

const LeagueWheel = () => {

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
     <WheelComponent OPTIONS={LEAGUES} />
    </div>
  );
};

export default LeagueWheel;
