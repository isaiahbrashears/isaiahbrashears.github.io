import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import PlayerSelect from './components/PlayerSelect';
import PlayerPortal from './components/PlayerPortal';
import AdminDashboard from './components/AdminDashboard';
import { findPlayerByName } from '../../utils/firebase';

const Jeopardy = () => {
  const { playerName } = useParams();
  const location = useLocation();
  const [playerId, setPlayerId] = useState(location.state?.playerId || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerName && playerName !== 'admin') {
      const findPlayer = async () => {
        try {
          setLoading(true);
          const decodedPlayerName = decodeURIComponent(playerName);

          // If we already have playerId from navigation state, use it
          if (location.state?.playerId) {
            setPlayerId(location.state.playerId);
          } else {
            // Otherwise, look up the player by name
            const player = await findPlayerByName(decodedPlayerName);
            if (player) {
              setPlayerId(player.id);
            }
          }
        } catch (err) {
          console.error('Error finding player:', err);
        } finally {
          setLoading(false);
        }
      };

      findPlayer();
    } else {
      setLoading(false);
    }
  }, [playerName, location.state?.playerId]);

  // If no player name in URL, show player selection
  if (!playerName) {
    return <PlayerSelect />;
  }

  // If admin route, show admin dashboard
  if (playerName === 'admin') {
    return <AdminDashboard />;
  }

  // If loading player data, show loading state
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  // If player found, show player portal
  if (playerId) {
    return <PlayerPortal player={decodeURIComponent(playerName)} playerId={playerId} />;
  }

  // If player not found, show error
  return (
    <div style={{ padding: '20px', textAlign: 'center' }} className="jeopardy">
      <p>Player not found</p>
      <PlayerSelect />
    </div>
  );
};

export default Jeopardy;
