
import React from 'react';
import { Tile as TileType } from '../types';

interface TileProps {
  tile: TileType;
  index: number;
  onClick: (tile: TileType) => void;
  tileSize: number;
  gridSize: number;
  imageUrl: string;
  isSolved: boolean;
}

const Tile: React.FC<TileProps> = ({ tile, index, onClick, tileSize, gridSize, imageUrl, isSolved }) => {
  const { originalIndex, isEmpty } = tile;

  const top = Math.floor(index / gridSize) * tileSize;
  const left = (index % gridSize) * tileSize;

  const bgPosX = (originalIndex % gridSize) * tileSize;
  const bgPosY = Math.floor(originalIndex / gridSize) * tileSize;

  const tileStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${tileSize}px`,
    height: `${tileSize}px`,
    transform: `translate3d(${left}px, ${top}px, 0)`,
    backgroundImage: isEmpty ? 'none' : `url(${imageUrl})`,
    backgroundSize: `${tileSize * gridSize}px ${tileSize * gridSize}px`,
    backgroundPosition: `-${bgPosX}px -${bgPosY}px`,
    transition: 'transform 0.3s ease-in-out',
    boxShadow: isEmpty ? 'none' : 'inset 0 0 1px rgba(255, 255, 255, 0.2)',
    backgroundColor: isEmpty ? 'transparent' : '#1e293b' // bg-slate-800
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
        ${canMove ? 'cursor-pointer' : ''}
        ${canMove && !isSolved ? 'hover:scale-105 hover:z-10' : ''}
        ${isSolved ? 'border-none' : ''}
      `}
    />
  );
};

export default Tile;
