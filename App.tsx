import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tile } from './types';
import { GRID_SIZE, TILE_COUNT, EMPTY_TILE_ID, IMAGE_URL, SHUFFLE_MOVES_COUNT } from './constants';
import PuzzleBoard from './components/PuzzleBoard';
import { PuzzleIcon, ShuffleIcon, CheckCircleIcon } from './components/Icons';

const App: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isSolved, setIsSolved] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [isAutoShuffling, setIsAutoShuffling] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [boardSize, setBoardSize] = useState({ width: 800, height: 450 });

  useEffect(() => {
    const calculateBoardSize = () => {
      const mainPadding = 32; // Corresponds to p-4 on the main container
      const buttonsHeight = 80; // Approximate height for the buttons area and its margin
      
      const availableWidth = window.innerWidth - mainPadding;
      const availableHeight = window.innerHeight - buttonsHeight;

      const aspectRatio = 16 / 9;
      let newWidth, newHeight;

      if (availableWidth / availableHeight > aspectRatio) {
        // Height is the limiting factor
        newHeight = availableHeight;
        newWidth = newHeight * aspectRatio;
      } else {
        // Width is the limiting factor
        newWidth = availableWidth;
        newHeight = newWidth / aspectRatio;
      }
      
      setBoardSize({ width: newWidth, height: newHeight });
    };

    calculateBoardSize();
    window.addEventListener('resize', calculateBoardSize);
    return () => window.removeEventListener('resize', calculateBoardSize);
  }, []);

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
        setIsAutoShuffling(false); // Stop auto-shuffling on solve
      }
    }
  }, [tiles, isBusy, isSolved, checkSolved]);
  
  const shuffle = useCallback(async () => {
      setIsBusy(true);
      setIsSolved(false);

      let currentTiles = [...tiles];
      
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      let emptyIndex = currentTiles.findIndex(t => t.isEmpty);
      if (emptyIndex === -1) {
          console.error("Empty tile not found, resetting puzzle.");
          currentTiles = createSolvedGrid();
          emptyIndex = EMPTY_TILE_ID;
      }
      
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
        
        setTiles([...currentTiles]);
        await sleep(5);
      }
      setIsBusy(false);
  }, [tiles, createSolvedGrid]);

  const shuffleRef = useRef(shuffle);
  useEffect(() => {
    shuffleRef.current = shuffle;
  });

  useEffect(() => {
    if (tiles.length === 0 || !isAutoShuffling) {
      return;
    }

    let timeoutId: number;
    let isStillAutoShuffling = true;

    const shuffleLoop = async () => {
      await shuffleRef.current();
      if (isStillAutoShuffling) {
        // Continuous shuffle with no delay, yielding to event loop
        timeoutId = setTimeout(shuffleLoop, 0);
      }
    };

    shuffleLoop();

    return () => {
      isStillAutoShuffling = false;
      clearTimeout(timeoutId);
    };
  }, [isAutoShuffling, tiles.length]);

  const solve = useCallback(async () => {
      setIsAutoShuffling(false);
      setIsBusy(true);
      setIsSolving(true);
      const solvedGrid = createSolvedGrid();
      setTiles(solvedGrid);
      
      const animationTime = TILE_COUNT * 20 + 1000; 
      await new Promise(resolve => setTimeout(resolve, animationTime));

      setIsSolved(true);
      setIsBusy(false);
      setIsSolving(false);
  }, [createSolvedGrid]);

  const handlePlayAgain = useCallback(() => {
    const solvedGrid = createSolvedGrid();
    setTiles(solvedGrid);
    setIsSolved(false);
    setIsAutoShuffling(true);
  }, [createSolvedGrid]);

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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-cyan-900 overflow-hidden">
      <div 
        className="relative"
        style={{ width: boardSize.width, height: boardSize.height }}
      >
        <PuzzleBoard 
            tiles={tiles} 
            onTileClick={handleTileClick} 
            isSolved={isSolved} 
            isSolving={isSolving}
            width={boardSize.width}
            height={boardSize.height}
        />
        {isSolved && !isSolving && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in">
                <CheckCircleIcon className="w-20 h-20 text-green-400" />
                <h2 className="text-4xl font-bold mt-4 text-white">Puzzle Solved!</h2>
                <button
                    onClick={handlePlayAgain}
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
          onClick={() => setIsAutoShuffling(prev => !prev)}
          disabled={isBusy && !isAutoShuffling}
          className="flex items-center gap-2 w-40 justify-center px-5 py-3 bg-cyan-600 text-white font-semibold rounded-md shadow-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-300"
        >
          <ShuffleIcon className="w-5 h-5"/>
          {isAutoShuffling ? 'Stop Shuffling' : 'Auto-Shuffle'}
        </button>
        <button
          onClick={solve}
          disabled={isBusy || isSolved || isAutoShuffling}
          className="flex items-center gap-2 w-40 justify-center px-5 py-3 bg-teal-600 text-white font-semibold rounded-md shadow-lg hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 transition-all duration-300"
        >
          <PuzzleIcon className="w-5 h-5"/>
          Auto-Solve
        </button>
      </div>
    </div>
  );
};

export default App;