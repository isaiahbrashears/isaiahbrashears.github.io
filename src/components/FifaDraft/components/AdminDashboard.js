/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  setFifaCurrentCategory,
  subscribeToFifaCurrentCategory,
  setFifaCurrentRule,
  subscribeToFifaCurrentRule,
  setFifaCurrentRound,
  subscribeToFifaCurrentRound,
  setFifaDraftOrder,
  subscribeToFifaDraftOrder,
  setFifaCurrentTurnIndex,
  subscribeToFifaCurrentTurnIndex,
  subscribeToPlayers,
} from "../../../utils/fifaFirebase";
import LeagueWheel from './wheels/LeagueWheel';
import NationalityWheel from "./wheels/NationalityWheel";
import NumberWheel from "./wheels/NumberWheel";
import RatingWheel from "./wheels/RatingWheel";
import CategoryWheel from "./wheels/CategoryWheel";

import { lightenColor } from "../../../utils/lightenColor";
import AdminDrafterTable from "./AdminDrafterTable";

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [draftOrderEditable, setDraftOrderEditable] = useState(false);
  const [adminButtonsVisible, setAdminButtonsVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('Category');
  const [currentRule, setCurrentRule] = useState({});
  const [currentRound, setCurrentRound] = useState(1);
  const [drafters, setDrafters] = useState([]);
  const [draftOrder, setDraftOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

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

    const unsubscribeRound = subscribeToFifaCurrentRound((round) => {
        if (round) {
          setCurrentRound(round)
        }
    })

    const unsubscribeDrafters = subscribeToPlayers((players) => {
        if (players) {
          setDrafters(players)
        }
    })

    const unsubscribeDraftOrder = subscribeToFifaDraftOrder((order) => {
        setDraftOrder(order || [])
    })

    const unsubscribeTurnIndex = subscribeToFifaCurrentTurnIndex((index) => {
        setCurrentTurnIndex(typeof index === 'number' ? index : 0)
    })

    return () => {
      if (unsubscribeCategory) unsubscribeCategory();
      if (unsubscribeRule) unsubscribeRule();
      if (unsubscribeRound) unsubscribeRound();
      if (unsubscribeDrafters) unsubscribeDrafters();
      if (unsubscribeDraftOrder) unsubscribeDraftOrder();
      if (unsubscribeTurnIndex) unsubscribeTurnIndex();
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



  const handleNextRound = () => {
    const nextRound = Math.min(currentRound + 1, 15);
    setCurrentRound(nextRound);
    setFifaCurrentRound(nextRound).catch((err) => {
      console.error('Error saving round:', err);
    });
    setCurrentTurnIndex(0);
    setFifaCurrentTurnIndex(0).catch((err) => {
      console.error('Error resetting turn:', err);
    });
  };

  const orderedDrafters = [
    ...draftOrder.map((id) => drafters.find((drafter) => drafter.id === id)).filter(Boolean),
    ...drafters.filter((drafter) => !draftOrder.includes(drafter.id)),
  ];

  const moveDraftOrderEntry = (index, direction) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= draftOrder.length) return;

    const newOrder = [...draftOrder];
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    setDraftOrder(newOrder);
    setFifaDraftOrder(newOrder).catch((err) => {
      console.error('Error saving draft order:', err);
    });
  };

   const handlePrevRound = () => {
    const nextRound = Math.min(currentRound - 1, 15);
    setCurrentRound(nextRound);
    setFifaCurrentRound(nextRound).catch((err) => {
      console.error('Error saving round:', err);
    });
  };
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
      <h2 className="text-center">Round {currentRound} / 15</h2>
      <div className="fifa-drafters-container">
        {orderedDrafters.map((drafter, index) => {
          return (
            <AdminDrafterTable
              key={drafter.id}
              drafter={drafter}
              currentTurnIndex={currentTurnIndex}
              index={index}
            />
          )
        })}
      </div>

      <div>
        <button
          className="new-category-btn button passed-color m-auto"
          disabled={currentRound <= 1}
          style={{
            '--button-color': '#ffdf00',
            '--button-text-color': 'black',
          }}
          onClick={() => setAdminButtonsVisible(!adminButtonsVisible)
        }>
          Admin Functions
        </button>
      </div>
      {adminButtonsVisible && (

        <div className="fifa-admin-buttons">
          <div className="flex mb-4">
            <button
                className="new-category-btn button passed-color m-auto"
                disabled={currentRound <= 1}
                style={{
                  '--button-color': '#6f1515',
                  '--button-text-color': 'white',
                }}
                onClick={() => handlePrevRound()
                }>
              Prev Round
            </button>
            <button
                className="new-category-btn button passed-color m-auto"
                disabled={currentRound >= 15}
                style={{
                  '--button-color': '#2980b9',
                  '--button-text-color': 'white',
                }}
                onClick={() => handleNextRound()
                }>
              Next Round
            </button>
          </div>
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
          <div className="fifa-draft-order">
          <button
            className="new-category-btn button passed-color m-auto"
            style={{
              '--button-color': '#010000',
              '--button-text-color': 'white',
            }}
            onClick={() => setDraftOrderEditable(!draftOrderEditable)}
          >
            Edit Draft Order
          </button>
          {draftOrderEditable && (
            <ol className="fifa-draft-order-list">
              <h3>Draft Order</h3>

              {draftOrder.map((id, index) => {
                const drafter = drafters.find((d) => d.id === id);
                  return (
                    <li
                    key={id}
                    className={index === currentTurnIndex ? 'fifa-draft-order-active' : ''}
                    >
                      {drafter?.name || id}
                      <button
                        onClick={() => moveDraftOrderEntry(index, -1)}
                        disabled={index === 0}
                        className="ml-auto"
                        >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDraftOrderEntry(index, 1)}
                        disabled={index === draftOrder.length - 1}
                        >
                        ↓
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
           </div>
      )}
    </div>
   </div>
  );
};

export default AdminDashboard;
