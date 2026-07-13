/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeToPlayers, addFifaPlayer, deleteFifaPlayer } from "../../../utils/fifaFirebase";

const AdminDrafterTable = ({ drafter = {}, index, currentTurnIndex }) => {

  useEffect(() => {

  }, []);

  const deleteDrafter = () => {
    deleteFifaPlayer(drafter.id)
  }

  return (
    <div className="admins-drafter-table">
      <h4 className={index === currentTurnIndex ? 'fifa-draft-order-active' : ''}>{drafter.name}</h4>
      <button onClick={deleteDrafter}>Remove this cunt</button>
      <ol>
        {drafter?.draftedPlayerList.map((player, index) => (
          <li key={`${player.name}-${index}`}>
            {player.name} ({player.currentCategory}: {player.currentRule})
          </li>
        ))}
      </ol>
    </div>
  );
};

export default AdminDrafterTable;
