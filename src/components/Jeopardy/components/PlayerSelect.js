/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { fetchSheetData } from "../../../utils/googleSheets";

const PlayerSelect = ({ onPlayerSelected = () => {} }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Google Sheets configuration
  const SHEET_ID = '1B2sbqWxT5_C90tpRbrSHbIYUd9jHMrIi5HACZTq5074';
  const RANGE = 'Players!A2:A11'; // Players sheet, rows 2-11 in column A
  const API_KEY = 'AIzaSyBttryaeAIQgtRYr420ezByQsmWDfYuoEY';

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const data = await fetchSheetData(SHEET_ID, RANGE, API_KEY);
        // Filter out empty strings and header if present
        const filteredData = data.filter(player => player && player.trim() !== '');
        setPlayers(filteredData);
        setError(null);
      } catch (err) {
        setError('Failed to load players from Google Sheets');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  const handlePlayerClick = (player) => {
    onPlayerSelected(player);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading players...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Select Your Name</h2>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {players.map((player, index) => (
          <button
            key={index}
            onClick={() => handlePlayerClick(player)}
            style={{
              padding: '16px 24px',
              fontSize: '16px',
              backgroundColor: '#060CE9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0509B8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#060CE9'}
          >
            {player}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlayerSelect;
