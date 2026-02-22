/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeToPlayers } from "../../../utils/firebase";

const PlayerSelect = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);

    // Subscribe to real-time player updates
    const unsubscribe = subscribeToPlayers((allPlayers) => {
      // Filter out empty names
      const filteredPlayers = allPlayers.filter(p => p.name && p.name.trim() !== '');
      setPlayers(filteredPlayers);
      setLoading(false);
      setError(null);
    });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handlePlayerClick = (player) => {
    // Navigate to /jeopardy/{playerName} with player ID in state
    navigate(`/jeopardy/${encodeURIComponent(player.name)}`, {
      state: { playerId: player.id }
    });
  };

  if (error) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '20px' }} className="jeopardy">
      <h2 className="text-center">Select Your Name</h2>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {players.map((player) => (
          <button
            key={player.id}
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
            {player.name}
          </button>
        ))}
        <button
            onClick={() => navigate('/jeopardy/admin')}
            style={{
              padding: '16px 24px',
              fontSize: '16px',
              backgroundColor: '#6f1908ff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#8a0c0cff'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#e97406ff'}
          >
            Admin Portal
          </button>
      </div>
    </div>
  );
};

export default PlayerSelect;
