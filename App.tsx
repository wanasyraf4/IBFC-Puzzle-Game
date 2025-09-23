import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Tile } from './types';
import { GRID_SIZE, TILE_COUNT, EMPTY_TILE_ID, IMAGE_URL, SHUFFLE_MOVES_COUNT, FINAL_PIECE_URL } from './constants';
import PuzzleBoard from './components/PuzzleBoard';
import { PuzzleIcon, ShuffleIcon } from './components/Icons';

type GameMode = 'sliding' | 'finalPiece' | 'completed';

const CONFETTI_COUNT = 150;
const COLORS = ['#fde047', '#67e8f9', '#f472b6', '#86efac', '#a78bfa'];

const Confetti: React.FC = () => {
  const confettiPieces = useMemo(() => {
    return Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
      const duration = Math.random() * 3 + 3; // 3 to 6 seconds
      const delay = Math.random() * 4; // 0 to 4 seconds delay
      const style: React.CSSProperties = {
        position: 'absolute',
        width: `${Math.random() * 10 + 5}px`,
        height: `${Math.random() * 8 + 5}px`,
        backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)],
        top: '-10%',
        left: `${Math.random() * 100}%`,
        animation: `confetti-fall ${duration}s ${delay}s linear forwards`,
        opacity: 0,
      };
      return <div key={i} style={style} className="rounded-sm" />;
    });
  }, []);

  return <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">{confettiPieces}</div>;
};


const App: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [isAutoShuffling, setIsAutoShuffling] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [boardSize, setBoardSize] = useState({ width: 800, height: 450 });
  const [shufflePath, setShufflePath] = useState<[number, number][]>([]);
  
  // New state for the final piece mini-game
  const [gameMode, setGameMode] = useState<GameMode>('sliding');
  const [isDroppable, setIsDroppable] = useState(false);
  const [isFinalPiecePlaced, setIsFinalPiecePlaced] = useState(false);


  useEffect(() => {
    const calculateBoardSize = () => {
      const mainPadding = 32;
      const buttonsHeight = 80;
      const finalPiecePromptHeight = 120; // Space for the draggable piece prompt
      
      const availableWidth = window.innerWidth - mainPadding;
      const availableHeight = window.innerHeight - buttonsHeight - finalPiecePromptHeight;

      const aspectRatio = 16 / 9;
      let newWidth, newHeight;

      if (availableWidth / availableHeight > aspectRatio) {
        newHeight = availableHeight;
        newWidth = newHeight * aspectRatio;
      } else {
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
      const pieceImg = new Image();
      pieceImg.src = FINAL_PIECE_URL;
      pieceImg.onload = () => {
        setImageLoaded(true);
        setTiles(createSolvedGrid());
      }
    };
  }, [createSolvedGrid]);

  const onPuzzleSolved = useCallback(() => {
    setIsSolved(true);
    setIsAutoShuffling(false);
    setIsBusy(true); // Prevent clicks during transition
    setTimeout(() => {
      setGameMode('finalPiece');
      setIsBusy(false);
    }, 2000); // 2 second delay
  }, []);

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
      setShufflePath([]);
      if (checkSolved(newTiles)) {
        onPuzzleSolved();
      }
    }
  }, [tiles, isBusy, isSolved, checkSolved, onPuzzleSolved]);
  
  const shuffle = useCallback(async () => {
      setIsBusy(true);
      if (isSolved) {
        setShufflePath([]);
      }
      setIsSolved(false);

      let currentTiles = [...tiles];
      const pathSegment: [number, number][] = [];
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      let emptyIndex = currentTiles.findIndex(t => t.isEmpty);
      if (emptyIndex === -1) {
          currentTiles = createSolvedGrid();
          emptyIndex = EMPTY_TILE_ID;
      }
      
      for (let i = 0; i < SHUFFLE_MOVES_COUNT; i++) {
        const neighbors: number[] = [];
        const { row, col } = { row: Math.floor(emptyIndex / GRID_SIZE), col: emptyIndex % GRID_SIZE };

        if (row > 0) neighbors.push(emptyIndex - GRID_SIZE);
        if (row < GRID_SIZE - 1) neighbors.push(emptyIndex + GRID_SIZE);
        if (col > 0) neighbors.push(emptyIndex - 1);
        if (col < GRID_SIZE - 1) neighbors.push(emptyIndex + 1);
        
        const randomIndex = Math.floor(Math.random() * neighbors.length);
        const tileToMoveIndex = neighbors[randomIndex];
        
        pathSegment.push([emptyIndex, tileToMoveIndex]);

        [currentTiles[emptyIndex], currentTiles[tileToMoveIndex]] = [currentTiles[tileToMoveIndex], currentTiles[emptyIndex]];
        emptyIndex = tileToMoveIndex;
        
        setTiles([...currentTiles]);
        await sleep(5);
      }
      setShufflePath(prev => [...prev, ...pathSegment]);
      setIsBusy(false);
  }, [tiles, createSolvedGrid, isSolved]);

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
      
      if (shufflePath.length === 0) {
        console.warn("No path to reverse.");
        return;
      }

      setIsBusy(true);
      setIsSolving(true);

      let currentTiles = [...tiles];
      const reversedPath = [...shufflePath].reverse();
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (const move of reversedPath) {
          const [index1, index2] = move;
          [currentTiles[index1], currentTiles[index2]] = [currentTiles[index2], currentTiles[index1]];
          setTiles([...currentTiles]);
          await sleep(2);
      }

      setShufflePath([]);
      setIsBusy(false);
      setIsSolving(false);
      onPuzzleSolved();
  }, [shufflePath, tiles, onPuzzleSolved]);

  const handlePlayAgain = useCallback(() => {
    const solvedGrid = createSolvedGrid();
    setTiles(solvedGrid);
    setShufflePath([]);
    setIsSolved(false);
    setIsAutoShuffling(true);
    setGameMode('sliding');
    setIsFinalPiecePlaced(false);
  }, [createSolvedGrid]);

  const handleToggleAutoShuffle = () => {
    if (isSolved) {
        setShufflePath([]);
    }
    setIsAutoShuffling(prev => !prev);
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (gameMode === 'finalPiece') setIsDroppable(true);
  };
  const handleDragLeave = () => setIsDroppable(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (gameMode === 'finalPiece') {
      setIsDroppable(false);
      setIsFinalPiecePlaced(true);
      setTimeout(() => setGameMode('completed'), 1000);
    }
  };

  const boardPadding = 16;
  const gridWidth = boardSize.width - boardPadding;
  const gridHeight = boardSize.height - boardPadding;
  const tileWidth = gridWidth / GRID_SIZE;
  const tileHeight = gridHeight / GRID_SIZE;
  // const dropZoneSize = { width: tileWidth * 2, height: tileHeight * 2 };
  // Example of how to change it to a fixed size
  const dropZoneSize = { width: 343, height: 126 };
  const dropZonePosition = {
      // top: (GRID_SIZE / 2 - 1) * tileHeight + boardPadding / 2,
      top: (GRID_SIZE / 2 - 1) * tileHeight + boardPadding / 2 - 69,
      left: (GRID_SIZE / 2 - 1) * tileWidth + boardPadding / 2 - 84,
  };

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
        
        {gameMode === 'finalPiece' && !isFinalPiecePlaced && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                ...dropZonePosition,
                ...dropZoneSize,
            }}
            className={`absolute border-2 border-dashed rounded-md transition-all duration-300 animate-fade-in ${isDroppable ? 'bg-green-500/30 border-green-400 scale-110 shadow-2xl shadow-green-400/80' : 'bg-slate-900/50 border-cyan-400 shadow-lg shadow-cyan-500/30 animate-pulse'}`}
          />
        )}
        
        {isFinalPiecePlaced && (
            <img
                src={FINAL_PIECE_URL}
                alt="Final puzzle piece"
                className="absolute animate-piece-in"
                style={{
                  ...dropZonePosition,
                  ...dropZoneSize,
                }}
            />
        )}
        
        {gameMode === 'completed' && <Confetti />}
      </div>

      <div className="mt-6 flex flex-col justify-center items-center" style={{ height: '120px' }}>
        {gameMode === 'sliding' && (
          <div className="flex space-x-4">
            <button
              onClick={handleToggleAutoShuffle}
              disabled={isBusy && !isAutoShuffling}
              className="flex items-center gap-2 w-40 justify-center px-5 py-3 bg-cyan-600 text-white font-semibold rounded-md shadow-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-300"
            >
              <ShuffleIcon className="w-5 h-5"/>
              {isAutoShuffling ? 'Stop Shuffling' : 'Auto-Shuffle'}
            </button>
            <button
              onClick={solve}
              disabled={isBusy || isSolved || isAutoShuffling || shufflePath.length === 0}
              className="flex items-center gap-2 w-40 justify-center px-5 py-3 bg-teal-600 text-white font-semibold rounded-md shadow-lg hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 transition-all duration-300"
            >
              <PuzzleIcon className="w-5 h-5"/>
              Auto-Solve
            </button>
          </div>
        )}

        {gameMode === 'finalPiece' && !isFinalPiecePlaced && (
          <div className="text-center animate-fade-in">
              <p className="mb-4 text-lg text-slate-300">Place the final piece to complete the puzzle.</p>
              <img
                src={FINAL_PIECE_URL}
                draggable="true"
                onDragStart={(e) => e.dataTransfer.setData('text/plain', 'piece')}
                // className="w-60 h-30 mx-auto cursor-grab active:cursor-grabbing drop-shadow-[0_5px_15px_rgba(0,255,255,0.3)] hover:scale-110 transition-transform"
                className="w-[343px] h-[126px] mx-auto cursor-grab active:cursor-grabbing drop-shadow-[0_5px_15px_rgba(0,255,255,0.3)] hover:scale-110 transition-transform"
                alt="Draggable puzzle piece"
              />
          </div>
        )}

        {gameMode === 'completed' && (
            <div 
              className="opacity-0"
              style={{ animation: 'fade-in 0.5s ease-in-out 3s forwards' }}
            >
              <button
                  onClick={handlePlayAgain}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-md shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
              >
                  <ShuffleIcon className="w-5 h-5"/>
                  Play Again
              </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;