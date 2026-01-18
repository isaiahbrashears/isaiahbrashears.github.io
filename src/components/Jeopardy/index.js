import React, { useState } from 'react';
import PlayerSelect from './components/PlayerSelect';
import PlayerPortal from './PlayerPortal';

const Jeopardy = () => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handlePlayerSelected = (player) => {
    setSelectedPlayer(player);
  };

  if (selectedPlayer) {
    return <PlayerPortal player={selectedPlayer} />;
  }

  return <PlayerSelect onPlayerSelected={handlePlayerSelected} />;
}

export default Jeopardy;
