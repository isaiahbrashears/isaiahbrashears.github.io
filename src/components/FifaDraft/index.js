import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import DrafterSelect from './components/DrafterSelect';
import { findFifaPlayerByName } from '../../utils/fifaFirebase';
import DrafterPortal from './components/DrafterPortal';
import AdminDashboard from './components/AdminDashboard';

const FifaDraft = () => {
  const { playerName } = useParams();
  const location = useLocation();
  const [playerId, setPlayerId] = useState(location.state?.playerId || null);

  useEffect(() => {
    if (playerName && playerName !== 'admin') {
      const findPlayer = async () => {
        try {
          const decodedPlayerName = decodeURIComponent(playerName);

          // If we already have playerId from navigation state, use it
          if (location.state?.playerId) {
            setPlayerId(location.state.playerId);
          }
          else {
            // Otherwise, look up the player by name
            const player = await findFifaPlayerByName(decodedPlayerName);
            if (player) {
              setPlayerId(player.id);
            }
          }
        }
        catch (err) {
          console.error('Error finding player:', err);
        }
      };

      findPlayer();
    }
  }, [playerName, location.state?.playerId]);

  if (playerName === 'admin') {
    return <AdminDashboard />;
  }

  if (playerId) {
    return (
      <DrafterPortal
        player={decodeURIComponent(playerName)}
        playerId={playerId}
      />
    );
  }

  return (
    <>
      <DrafterSelect />
    </>
  );
};

export default FifaDraft;
