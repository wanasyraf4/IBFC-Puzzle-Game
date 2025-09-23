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
}

const Tile: React.FC<TileProps> = ({ tile, index, onClick, tileWidth, tileHeight, gridWidth, gridHeight, gridSize, imageUrl, isSolved, isSolving }) => {
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
    transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDelay: isSolving ? `${originalIndex * 20}ms` : '0s',
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