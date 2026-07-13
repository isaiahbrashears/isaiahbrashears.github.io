/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  submitPlayerAnswer,
  subscribeToPlayer,
  subscribeToGameState,
} from "../../../utils/fifaFirebase";
import LeagueWheel from './LeagueWheel';

import '../fifa.scss'

const AdminDashboard = () => {
  const [answer, setAnswer] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('');


  useEffect(() => {


  }, []);


  return (
   <div className="fifa-draft-admin-Dashboard">
    <div className="fifa-draft-wheels">
      <h1 className="text-center">Wheel side</h1>
      <LeagueWheel />
    </div>

    <div className="fifa-draft-player-tracking">
      <h1 className="text-center">Admin Portal</h1>
    </div>
   </div>
  );
};

export default AdminDashboard;
