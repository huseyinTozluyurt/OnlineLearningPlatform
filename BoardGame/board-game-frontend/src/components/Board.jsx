import React from "react";
import "../styles/board.css";
import PlayerToken from "./PlayerToken";

function Board({ players }) {
  const tilesPerPlayer = 17;

  return (
    <div className="board-wrapper-horizontal">
      <div className="board-horizontal">
        {/* Player rows with tiles */}
        {players.map((player) => (
          <div key={player.id} className="player-row-labeled">
            {/* ✅ show username (max 8 chars) */}
            <div className="player-label">{player.name || `Player ${player.id}`}</div>

            <div className="tile-row">
              {Array.from({ length: tilesPerPlayer }).map((_, index) => (
                <div
                  className="tile-horizontal"
                  key={index}
                  style={{
                    backgroundColor: index === 0 ? "#f0f0f0" : undefined,
                    backgroundImage:
                      index === 0 ? "none" : `url(/images/tiles/tile${index}.png)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                  }}
                >
                  {player.position === index && (
                    <PlayerToken key={player.id} color={player.color} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Box labels below each column */}
        <div className="box-label-row">
          <div className="player-label" /> {/* empty space for alignment */}
          <div className="tile-row">
            {Array.from({ length: tilesPerPlayer }).map((_, index) => (
              <div className="box-label" key={index}>
                Box {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Board;
