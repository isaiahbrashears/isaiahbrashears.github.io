import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import './scatagories.scss';
import PlayerSelect from './components/PlayerSelect';
import PlayerPortal from './components/PlayerPortal';
import AdminPortal from './components/AdminPortal';

const Scatagories = () => {
  const { playerName } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname === '/scatagories/admin';

  return (
    <div className="scatagories-container">
      {isAdmin
        ? <AdminPortal />
        : playerName
          ? <PlayerPortal player={decodeURIComponent(playerName)} />
          : <PlayerSelect />
      }
    </div>
  );
};

export default Scatagories;
