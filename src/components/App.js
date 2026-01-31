import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import '../assets/styles/main.scss';
import FifaDraft from './FifaDraft';
import Jeopardy from './Jeopardy';
import AdminDashboard from './Jeopardy/components/AdminDashboard';
import GameSetup from './Jeopardy/components/GameSetup';
import Scatagories from './Scatagories';

const Home = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', minHeight: '20vh' }}>
      <Link to="/jeopardy" style={{
        padding: '16px 32px',
        fontSize: '18px',
        backgroundColor: '#060CE9',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 'bold'
      }}>
        Jeopardy
      </Link>
      <Link to="/scatagories" style={{
        padding: '16px 32px',
        fontSize: '18px',
        backgroundColor: '#511306ff',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 'bold'
      }}>
        Scat and Gories
      </Link>
      <Link to="/fifa-draft" style={{
        padding: '16px 32px',
        fontSize: '18px',
        backgroundColor: '#38003c',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 'bold'
      }}>
        FIFA Draft Wheel
      </Link>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <div className="wizard-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fifa-draft" element={<FifaDraft />} />
          <Route path="/jeopardy" element={<Jeopardy />} />
          <Route path="/jeopardy/setup" element={<GameSetup />} />
          <Route path="/jeopardy/admin" element={<AdminDashboard />} />
          <Route path="/jeopardy/:playerName" element={<Jeopardy />} />
          <Route path="/scatagories" element={<Scatagories />} />
          <Route path="/scatagories/player/:playerName" element={<Scatagories />} />
          <Route path="/scatagories/admin" element={<Scatagories />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
