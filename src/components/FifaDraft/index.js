import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import PlayerSelect from './components/PlayerSelect';
import { findFifaPlayerByName } from '../../utils/fifaFirebase';
import PlayerPortal from './components/PlayerPortal';


const FifaDraft = () => {
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
              const player = await findFifaPlayerByName(decodedPlayerName);
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

  if (playerId) {
    return (
      <PlayerPortal
        player={decodeURIComponent(playerName)}
        playerId={playerId}
      />
    );
  }

  return<>
    <PlayerSelect />
  </>
}

export default FifaDraft;
