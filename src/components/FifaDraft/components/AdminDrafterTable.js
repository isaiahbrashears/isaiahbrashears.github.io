/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeToPlayers, addFifaPlayer, deleteFifaPlayer } from "../../../utils/fifaFirebase";

const AdminDrafterTable = ({ drafter = {}, index, currentTurnIndex, editDrafter }) => {

  useEffect(() => {

  }, []);

  const deleteDrafter = () => {
    deleteFifaPlayer(drafter.id)
  }

  const handlePlayerDelete = () => {
      const confirmed = window.confirm(
        'This will permanently delete this player. Are you sure?'
      );
      if (!confirmed) return;

      deleteDrafter()
    };

  return (
    <div className="admins-drafter-table">
      <h4 className={index === currentTurnIndex ? 'fifa-draft-order-active' : ''}>{drafter.name}</h4>
      {editDrafter && (<button onClick={handlePlayerDelete}>Remove {drafter.name}</button>)}
      <ol>
        {drafter?.draftedPlayerList.map((player, index) => (
          <li key={`${player.name}-${index}`}>
            <span className="font-bold">{player.name}</span>{' '}
            ({player.currentCategory}: {player.currentRule})
          </li>
        ))}
      </ol>
    </div>
  );
};

export default AdminDrafterTable;
