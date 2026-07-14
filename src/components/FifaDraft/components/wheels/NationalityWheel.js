import React from 'react';
import WheelComponent from '../../utils/WheelComponent';

const COUNTRIES = [
  // Hosts
  { name: 'Canada', color: '#FF0000', shortName: 'CAN', weight: 1, icon: '🇨🇦' },
  { name: 'Mexico', color: '#006847', shortName: 'MEX', weight: 1, icon: '🇲🇽' },
  { name: 'United States', color: '#3C3B6E', shortName: 'USA', weight: 1, icon: '🇺🇸' },

  // AFC
  { name: 'Australia', color: '#00843D', shortName: 'AUS', weight: 1, icon: '🇦🇺' },
  { name: 'Iraq', color: '#CE1126', shortName: 'IRQ', weight: 1, icon: '🇮🇶' },
  { name: 'IR Iran', color: '#239F40', shortName: 'IRN', weight: 1, icon: '🇮🇷' },
  { name: 'Japan', color: '#003399', shortName: 'JPN', weight: 1, icon: '🇯🇵' },
  { name: 'Jordan', color: '#CE1126', shortName: 'JOR', weight: 1, icon: '🇯🇴' },
  { name: 'Korea Republic', color: '#CD2E3A', shortName: 'KOR', weight: 1, icon: '🇰🇷' },
  { name: 'Qatar', color: '#8D1B3D', shortName: 'QAT', weight: 1, icon: '🇶🇦' },
  { name: 'Saudi Arabia', color: '#006C35', shortName: 'KSA', weight: 1, icon: '🇸🇦' },
  { name: 'Uzbekistan', color: '#0099B5', shortName: 'UZB', weight: 1, icon: '🇺🇿' },

  // CAF
  { name: 'Algeria', color: '#006233', shortName: 'ALG', weight: 1, icon: '🇩🇿' },
  { name: 'Cabo Verde', color: '#003893', shortName: 'CPV', weight: 1, icon: '🇨🇻' },
  { name: 'Congo DR', color: '#007FFF', shortName: 'COD', weight: 1, icon: '🇨🇩' },
  { name: "Côte d'Ivoire", color: '#FF8200', shortName: 'CIV', weight: 1, icon: '🇨🇮' },
  { name: 'Egypt', color: '#CE1126', shortName: 'EGY', weight: 1, icon: '🇪🇬' },
  { name: 'Ghana', color: '#CE1126', shortName: 'GHA', weight: 1, icon: '🇬🇭' },
  { name: 'Morocco', color: '#C1272D', shortName: 'MAR', weight: 1, icon: '🇲🇦' },
  { name: 'Senegal', color: '#00853F', shortName: 'SEN', weight: 1, icon: '🇸🇳' },
  { name: 'South Africa', color: '#007A4D', shortName: 'RSA', weight: 1, icon: '🇿🇦' },
  { name: 'Tunisia', color: '#E70013', shortName: 'TUN', weight: 1, icon: '🇹🇳' },

  // CONCACAF (non-host)
  { name: 'Curaçao', color: '#002B7F', shortName: 'CUW', weight: 1, icon: '🇨🇼' },
  { name: 'Haiti', color: '#00209F', shortName: 'HAI', weight: 1, icon: '🇭🇹' },
  { name: 'Panama', color: '#DA121A', shortName: 'PAN', weight: 1, icon: '🇵🇦' },

  // CONMEBOL
  { name: 'Argentina', color: '#75AADB', shortName: 'ARG', weight: 1, icon: '🇦🇷' },
  { name: 'Brazil', color: '#FFDF00', shortName: 'BRA', weight: 1, icon: '🇧🇷' },
  { name: 'Colombia', color: '#FCD116', shortName: 'COL', weight: 1, icon: '🇨🇴' },
  { name: 'Ecuador', color: '#FFDD00', shortName: 'ECU', weight: 1, icon: '🇪🇨' },
  { name: 'Paraguay', color: '#D52B1E', shortName: 'PAR', weight: 1, icon: '🇵🇾' },
  { name: 'Uruguay', color: '#5A9BD5', shortName: 'URU', weight: 1, icon: '🇺🇾' },

  // OFC
  { name: 'New Zealand', color: '#000000', shortName: 'NZL', weight: 1, icon: '🇳🇿' },

  // UEFA
  { name: 'Austria', color: '#ED2939', shortName: 'AUT', weight: 1, icon: '🇦🇹' },
  { name: 'Belgium', color: '#ED2939', shortName: 'BEL', weight: 1, icon: '🇧🇪' },
  { name: 'Bosnia and Herzegovina', color: '#002F6C', shortName: 'BIH', weight: 1, icon: '🇧🇦' },
  { name: 'Croatia', color: '#FF0000', shortName: 'CRO', weight: 1, icon: '🇭🇷' },
  { name: 'Czechia', color: '#D7141A', shortName: 'CZE', weight: 1, icon: '🇨🇿' },
  { name: 'England', color: '#CE1124', shortName: 'ENG', weight: 1, icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'France', color: '#0055A4', shortName: 'FRA', weight: 1, icon: '🇫🇷' },
  { name: 'Germany', color: '#000000', shortName: 'GER', weight: 1, icon: '🇩🇪' },
  { name: 'Netherlands', color: '#FF6600', shortName: 'NED', weight: 1, icon: '🇳🇱' },
  { name: 'Norway', color: '#EF2B2D', shortName: 'NOR', weight: 1, icon: '🇳🇴' },
  { name: 'Portugal', color: '#006600', shortName: 'POR', weight: 1, icon: '🇵🇹' },
  { name: 'Scotland', color: '#0065BD', shortName: 'SCO', weight: 1, icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { name: 'Spain', color: '#AA151B', shortName: 'ESP', weight: 1, icon: '🇪🇸' },
  { name: 'Sweden', color: '#006AA7', shortName: 'SWE', weight: 1, icon: '🇸🇪' },
  { name: 'Switzerland', color: '#FF0000', shortName: 'SUI', weight: 1, icon: '🇨🇭' },
  { name: 'Türkiye', color: '#E30A17', shortName: 'TUR', weight: 1, icon: '🇹🇷' },
];

const NationalityWheel = ({ setCurrentRule }) => {

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
     <WheelComponent OPTIONS={COUNTRIES} setValue={setCurrentRule} />
    </div>
  );
};

export default NationalityWheel;
