import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PlayerSelect from './components/PlayerSelect';
import PlayerPortal from './components/PlayerPortal';
import { fetchSheetData } from '../../utils/googleSheets';

const Jeopardy = () => {
  const { playerName } = useParams();
  const [playerRow, setPlayerRow] = useState(null);
  const [loading, setLoading] = useState(true);

  // Google Sheets configuration
  const SHEET_ID = '1B2sbqWxT5_C90tpRbrSHbIYUd9jHMrIi5HACZTq5074';
  const RANGE = 'Players!A2:A11';
  const API_KEY = 'AIzaSyBttryaeAIQgtRYr420ezByQsmWDfYuoEY';

  useEffect(() => {
    if (playerName) {
      const findPlayerRow = async () => {
        try {
          setLoading(true);
          const data = await fetchSheetData(SHEET_ID, RANGE, API_KEY);
          const filteredData = data.filter(player => player && player.trim() !== '');

          // Find the index of the player name
          const decodedPlayerName = decodeURIComponent(playerName);
          const index = filteredData.findIndex(player => player === decodedPlayerName);

          if (index !== -1) {
            // Row number is index + 2 (because data starts at row 2)
            setPlayerRow(index + 2);
          }
        } catch (err) {
          console.error('Error finding player:', err);
        } finally {
          setLoading(false);
        }
      };

      findPlayerRow();
    } else {
      setLoading(false);
    }
  }, [playerName]);

  // If no player name in URL, show player selection
  if (!playerName) {
    return <PlayerSelect />;
  }

  // If loading player data, show loading state
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  // If player row found, show player portal
  if (playerRow) {
    return <PlayerPortal player={decodeURIComponent(playerName)} playerRow={playerRow} />;
  }

  // If player not found, show error
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Player not found</p>
      <PlayerSelect />
    </div>
  );
};

export default Jeopardy;
