import React from 'react';
import { Tile as TileType } from '../types';
import { GRID_SIZE, IMAGE_URL } from '../constants';
import Tile from './Tile';

interface PuzzleBoardProps {
  tiles: TileType[];
  onTileClick: (tile: TileType) => void;
  isSolved: boolean;
  isSolving: boolean;
  isCompleted: boolean;
  width: number;
  height: number;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ tiles, onTileClick, isSolved, isSolving, isCompleted, width, height }) => {
  // Assuming 1rem = 16px, p-2 is 0.5rem = 8px. Total padding is 16px.
  const boardPadding = 16;
  const gridWidth = width - boardPadding;
  const gridHeight = height - boardPadding;
  
  const tileWidth = gridWidth / GRID_SIZE;
  const tileHeight = gridHeight / GRID_SIZE;

  return (
    <div 
      className="relative bg-slate-800 p-2 rounded-lg shadow-2xl shadow-cyan-500/10"
      style={{ 
        width: width, 
        height: height 
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
            tileWidth={tileWidth}
            tileHeight={tileHeight}
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            gridSize={GRID_SIZE}
            imageUrl={IMAGE_URL}
            isSolved={isSolved}
            isSolving={isSolving}
            isCompleted={isCompleted}
          />
        ))}
      </div>
    </div>
  );
};

export default PuzzleBoard;