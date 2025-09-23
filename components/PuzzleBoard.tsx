
import React from 'react';
import { Tile as TileType } from '../types';
import { GRID_SIZE, IMAGE_URL } from '../constants';
import Tile from './Tile';

interface PuzzleBoardProps {
  tiles: TileType[];
  onTileClick: (tile: TileType) => void;
  isSolved: boolean;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ tiles, onTileClick, isSolved }) => {
  const boardSize = 600; // You can adjust this size
  const tileSize = boardSize / GRID_SIZE;

  return (
    <div 
      className="relative bg-slate-800 p-2 rounded-lg shadow-2xl shadow-cyan-500/10"
      style={{ 
        width: boardSize, 
        height: boardSize 
      }}
    >
      <div 
        className="relative w-full h-full"
      >
        {tiles.map((tile, index) => (
          <Tile
            key={tile.id}
            tile={tile}
            index={index}
            onClick={onTileClick}
            tileSize={tileSize}
            gridSize={GRID_SIZE}
            imageUrl={IMAGE_URL}
            isSolved={isSolved}
          />
        ))}
      </div>
    </div>
  );
};

export default PuzzleBoard;
