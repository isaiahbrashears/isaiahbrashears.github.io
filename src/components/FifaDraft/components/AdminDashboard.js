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
import NumberWheel from "./wheels/NumberWheel";
import RatingWheel from "./wheels/RatingWheel";
import CategoryWheel from "./wheels/CategoryWheel";

import { lightenColor } from "../../../utils/lightenColor";
import '../fifa.scss'

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('Category');
  const [currentRule, setCurrentRule] = useState({});
  const [drafters, setDrafters] = useState([]);

  const wheels = {
    Category: CategoryWheel,
    League: LeagueWheel,
    Nationality: NationalityWheel,
    Number: NumberWheel,
    Rating: RatingWheel
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


    </div>

    <div className="fifa-draft-player-tracking">
      <h1 className="text-center">Admin Portal</h1>
      <div>
        {drafters.map((drafter) => {
          return (
            <button key={drafter.id} onClick={() => deleteDrafter(drafter.id)}>Delete {drafter.name}</button>
          )
        })}

      <button
          className="new-category-btn button passed-color m-auto"
          style={{
            '--button-color': '#ffdf00',
            '--button-text-color': 'black',
          }}
          onClick={() => handleReset()
        }>
        Reset Category
      </button>
      </div>
    </div>
   </div>
  );
};

export default AdminDashboard;
