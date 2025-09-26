import React from 'react';
import { Tile as TileType } from '../types';

interface TileProps {
  tile: TileType;
  index: number;
  onClick: (tile: TileType) => void;
  tileWidth: number;
  tileHeight: number;
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  imageUrl: string;
  isSolved: boolean;
  isSolving: boolean;
  isCompleted: boolean;
}

const Tile: React.FC<TileProps> = ({ tile, index, onClick, tileWidth, tileHeight, gridWidth, gridHeight, gridSize, imageUrl, isSolved, isSolving, isCompleted }) => {
  const { originalIndex, isEmpty } = tile;

  const top = Math.floor(index / gridSize) * tileHeight;
  const left = (index % gridSize) * tileWidth;

  const bgPosX = (originalIndex % gridSize) * tileWidth;
  const bgPosY = Math.floor(originalIndex / gridSize) * tileHeight;

  const tileStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${tileWidth}px`,
    height: `${tileHeight}px`,
    transform: `translate3d(${left}px, ${top}px, 0)`,
    backgroundImage: isEmpty ? 'none' : `url(${imageUrl})`,
    backgroundSize: `${gridWidth}px ${gridHeight}px`,
    backgroundPosition: `-${bgPosX}px -${bgPosY}px`,
    // All tile movements, whether by player or auto-solve, should be quick and responsive.
    transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: 'transparent'
  };

  const handleClick = () => {
    onClick(tile);
  };
  
  const canMove = !isSolved && !isEmpty;

  return (
    <div
      style={tileStyle}
      onClick={handleClick}
      className={`
        ${canMove ? 'cursor-pointer hover:scale-105 hover:z-10' : ''}
        ${isCompleted || isEmpty ? 'border-none shadow-none' : 'border border-slate-900/75 shadow-[inset_0_0_2px_rgba(0,0,0,0.5)]'}
      `}
    />
  );
};

export default Tile;