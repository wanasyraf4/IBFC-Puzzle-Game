
import React, { useState, useEffect, useCallback } from 'react';
import { Tile } from './types';
import { GRID_SIZE, TILE_COUNT, EMPTY_TILE_ID, IMAGE_URL, SHUFFLE_MOVES_COUNT } from './constants';
import PuzzleBoard from './components/PuzzleBoard';
import { PuzzleIcon, ShuffleIcon, CheckCircleIcon } from './components/Icons';

const App: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isSolved, setIsSolved] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const createSolvedGrid = useCallback(() => {
    const initialTiles: Tile[] = [];
    for (let i = 0; i < TILE_COUNT; i++) {
      initialTiles.push({
        id: i,
        originalIndex: i,
        isEmpty: i === EMPTY_TILE_ID,
      });
    }
    return initialTiles;
  }, []);
  
  useEffect(() => {
    const img = new Image();
    img.src = IMAGE_URL;
    img.onload = () => {
        setImageLoaded(true);
        setTiles(createSolvedGrid());
    };
  }, [createSolvedGrid]);


  const checkSolved = useCallback((currentTiles: Tile[]) => {
    for (let i = 0; i < TILE_COUNT; i++) {
      if (currentTiles[i].id !== i) {
        return false;
      }
    }
    return true;
  }, []);

  const handleTileClick = useCallback((clickedTile: Tile) => {
    if (isBusy || isSolved || clickedTile.isEmpty) return;

    const emptyTileIndex = tiles.findIndex(t => t.isEmpty);
    const clickedTileIndex = tiles.findIndex(t => t.id === clickedTile.id);

    if (emptyTileIndex === -1) return;

    const emptyPos = { row: Math.floor(emptyTileIndex / GRID_SIZE), col: emptyTileIndex % GRID_SIZE };
    const clickedPos = { row: Math.floor(clickedTileIndex / GRID_SIZE), col: clickedTileIndex % GRID_SIZE };

    const isAdjacent = (Math.abs(emptyPos.row - clickedPos.row) + Math.abs(emptyPos.col - clickedPos.col)) === 1;

    if (isAdjacent) {
      const newTiles = [...tiles];
      [newTiles[emptyTileIndex], newTiles[clickedTileIndex]] = [newTiles[clickedTileIndex], newTiles[emptyTileIndex]];
      setTiles(newTiles);
      if (checkSolved(newTiles)) {
        setIsSolved(true);
      }
    }
  }, [tiles, isBusy, isSolved, checkSolved]);
  
  const shuffle = useCallback(async () => {
      setIsBusy(true);
      setIsSolved(false);

      let currentTiles = createSolvedGrid();
      
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      let emptyIndex = EMPTY_TILE_ID;
      for (let i = 0; i < SHUFFLE_MOVES_COUNT; i++) {
        const neighbors: number[] = [];
        const { row, col } = { row: Math.floor(emptyIndex / GRID_SIZE), col: emptyIndex % GRID_SIZE };

        if (row > 0) neighbors.push(emptyIndex - GRID_SIZE); // up
        if (row < GRID_SIZE - 1) neighbors.push(emptyIndex + GRID_SIZE); // down
        if (col > 0) neighbors.push(emptyIndex - 1); // left
        if (col < GRID_SIZE - 1) neighbors.push(emptyIndex + 1); // right
        
        const randomIndex = Math.floor(Math.random() * neighbors.length);
        const tileToMoveIndex = neighbors[randomIndex];
        
        [currentTiles[emptyIndex], currentTiles[tileToMoveIndex]] = [currentTiles[tileToMoveIndex], currentTiles[emptyIndex]];
        emptyIndex = tileToMoveIndex;

        if (i % 20 === 0) { // Update UI periodically
            setTiles([...currentTiles]);
            await sleep(10);
        }
      }
      setTiles(currentTiles);
      setIsBusy(false);
  }, [createSolvedGrid]);

  const solve = useCallback(async () => {
      setIsBusy(true);
      const solvedGrid = createSolvedGrid();
      
      const currentTilePositions: { [key: number]: number } = {};
      tiles.forEach((tile, index) => {
          currentTilePositions[tile.id] = index;
      });

      // Create a version of the solved grid that can be mutated for animation
      let animatingTiles = [...tiles];
      
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (const solvedTile of solvedGrid) {
          const currentPos = currentTilePositions[solvedTile.id];
          const correctPos = solvedTile.originalIndex;
          
          if (currentPos !== correctPos) {
              const tileToSwapWith = animatingTiles[correctPos];
              
              // Swap in the animating array
              [animatingTiles[currentPos], animatingTiles[correctPos]] = [animatingTiles[correctPos], animatingTiles[currentPos]];
              
              // Update positions map for next iteration
              currentTilePositions[solvedTile.id] = correctPos;
              currentTilePositions[tileToSwapWith.id] = currentPos;
          }
      }

      setTiles(solvedGrid);
      
      await sleep(500);
      setIsSolved(true);
      setIsBusy(false);
  }, [createSolvedGrid, tiles]);

  if (!imageLoaded) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
              <div className="text-center">
                <PuzzleIcon className="w-16 h-16 mx-auto animate-pulse text-cyan-400" />
                <p className="mt-4 text-xl">Loading Puzzle...</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-cyan-900">
      <div className="relative">
        <PuzzleBoard tiles={tiles} onTileClick={handleTileClick} isSolved={isSolved} />
        {isSolved && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in">
                <CheckCircleIcon className="w-20 h-20 text-green-400" />
                <h2 className="text-4xl font-bold mt-4 text-white">Puzzle Solved!</h2>
                <button
                    onClick={shuffle}
                    className="mt-6 flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-md shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500 transition-all duration-300"
                >
                    <ShuffleIcon className="w-5 h-5"/>
                    Play Again
                </button>
            </div>
        )}
      </div>

      <div className="flex space-x-4 mt-6">
        <button
          onClick={shuffle}
          disabled={isBusy}
          className="flex items-center gap-2 w-36 justify-center px-5 py-3 bg-cyan-600 text-white font-semibold rounded-md shadow-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-300"
        >
          <ShuffleIcon className="w-5 h-5"/>
          Shuffle
        </button>
        <button
          onClick={solve}
          disabled={isBusy || isSolved}
          className="flex items-center gap-2 w-36 justify-center px-5 py-3 bg-teal-600 text-white font-semibold rounded-md shadow-lg hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 transition-all duration-300"
        >
          <PuzzleIcon className="w-5 h-5"/>
          Auto-Solve
        </button>
      </div>
    </div>
  );
};

export default App;
