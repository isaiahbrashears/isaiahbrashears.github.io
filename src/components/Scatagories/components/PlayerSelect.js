import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addScatagoriesPlayer, subscribeToScatagoriesPlayers } from '../../../utils/scatagoriesFirebase';

const PlayerSelect = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToScatagoriesPlayers((allPlayers) => {
      setPlayers(allPlayers);
      setLoading(false);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSignUp = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await addScatagoriesPlayer(trimmed);
      setNewName('');
      navigate(`/scatagories/player/${encodeURIComponent(trimmed)}`);
    } catch (err) {
      console.error('Error signing up:', err);
      setError('Failed to join. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayerSelect = (player) => {
    navigate(`/scatagories/player/${encodeURIComponent(player.name)}`);
  };

  return (
    <div className="player-select-container">
      <div className="signup-section">
        <h2>Join the Game</h2>
        <div className="signup-form">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
            placeholder="Enter your name..."
            disabled={isSubmitting}
          />
          <button onClick={handleSignUp} disabled={!newName.trim() || isSubmitting}>
            {isSubmitting ? 'Joining...' : 'Join'}
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>

      <div className="divider">
        <span>or select your name</span>
      </div>

      {loading ? (
        <p className="text-center">Loading players...</p>
      ) : players.length > 0 ? (
        <div className="players-grid">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => handlePlayerSelect(player)}
              className="player-button"
            >
              {player.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center">No players yet. Be the first to join!</p>
      )}

      <div className="admin-link">
        <Link to="/scatagories/admin">Admin Portal</Link>
      </div>
    </div>
  );
};

export default PlayerSelect;
