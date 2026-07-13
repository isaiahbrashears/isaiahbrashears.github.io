/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  setFifaCurrentCategory,
  subscribeToFifaCurrentCategory,
  setFifaCurrentRule,
  subscribeToFifaCurrentRule,
  subscribeToPlayers,
  deleteFifaPlayer
} from "../../../utils/fifaFirebase";
import LeagueWheel from './wheels/LeagueWheel';
import NationalityWheel from "./wheels/NationalityWheel";

import '../fifa.scss'
import CategoryWheel from "./wheels/CategoryWheel";
import { lightenColor } from "../../../utils/lightenColor";

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('Category');
  const [currentRule, setCurrentRule] = useState({});
  const [drafters, setDrafters] = useState([]);

  const wheels = {
    Category: CategoryWheel,
    League: LeagueWheel,
    Nationality: NationalityWheel,
  }

  const WheelComponent = wheels[currentCategory];

  useEffect(() => {
    const unsubscribeCategory = subscribeToFifaCurrentCategory((category) => {
      if (category) {
        setCurrentCategory(category);
      }
      setIsLoading(false);
    });

    const unsubscribeRule = subscribeToFifaCurrentRule((rule) => {
        if (rule) {
          setCurrentRule(rule)
        }
    })

    const unsubscribeDrafters = subscribeToPlayers((players) => {
        if (players) {
          setDrafters(players)
        }
    })

    return () => {
      if (unsubscribeCategory) unsubscribeCategory();
      if (unsubscribeRule) unsubscribeRule();
      if (unsubscribeDrafters) unsubscribeDrafters();
    };
  }, []);

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    setFifaCurrentCategory(category).catch((err) => {
      console.error('Error saving category:', err);
    });
  };

  const handleRuleChange = (rule) => {
    setCurrentRule(rule);
    setFifaCurrentRule(rule).catch((err) => {
      console.error('Error saving rule:', err);
    });
  };

  const handleReset = () => {
    setCurrentRule({});
    setFifaCurrentRule({}).catch((err) => {
      console.error('Error saving rule:', err);
    });
    handleCategoryChange('Category')
  };

  const deleteDrafter = (playerId) => {
    deleteFifaPlayer(playerId)
  }

  return (
   <div className="fifa-draft-admin-Dashboard">
    <div className="fifa-draft-wheels">
      <h2 className="text-center">{currentCategory}</h2>
      <div
        className="fifa-draft-rule-display"
        style={currentRule.color ? {
          '--rule-color': currentRule.color,
          '--rule-color-light': lightenColor(currentRule.color, 40),
        } : undefined}
      >
         {currentRule?.icon} {currentRule.name} {currentRule?.icon}
        </div>
        {!isLoading ?
          <WheelComponent
          setCurrentCategory={handleCategoryChange}
          setCurrentRule={handleRuleChange}
          />
        : <p className="text-center">Loading...</p>
      }

      <button
      onClick={() => handleReset()}>
        New Category
      </button>
    </div>

    <div className="fifa-draft-player-tracking">
      <h1 className="text-center">Admin Portal</h1>
      <div>
        {console.log(drafters)
        }
        {drafters.map((drafter) => {
          return (
            <button onClick={() => deleteDrafter(drafter.id)}>Delete {drafter.name}</button>
          )
        })}
      </div>
    </div>
   </div>
  );
};

export default AdminDashboard;
