import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tile } from './types';
import { GRID_SIZE, TILE_COUNT, EMPTY_TILE_ID, IMAGE_URL, SHUFFLE_MOVES_COUNT, FINAL_PIECE_URL } from './constants';
import PuzzleBoard from './components/PuzzleBoard';
import CompletionEffect from './components/CompletionEffect';
import { PuzzleIcon, ShuffleIcon } from './components/Icons';

type GameMode = 'sliding' | 'finalPiece' | 'completed';

const App: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [isAutoShuffling, setIsAutoShuffling] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [boardSize, setBoardSize] = useState({ width: 800, height: 450 });
  const [shufflePath, setShufflePath] = useState<[number, number][]>([]);
  
  const [gameMode, setGameMode] = useState<GameMode>('sliding');
  const [isDroppable, setIsDroppable] = useState(false);
  const [isFinalPiecePlaced, setIsFinalPiecePlaced] = useState(false);

  // Touch drag state
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchTranslate, setTouchTranslate] = useState({ x: 0, y: 0 });
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const dropZoneRef = useRef<HTMLDivElement>(null);


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

  const placeFinalPiece = useCallback(() => {
    setIsDroppable(false);
    setIsFinalPiecePlaced(true);
    setTimeout(() => setGameMode('completed'), 1000);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (gameMode === 'finalPiece') setIsDroppable(true);
  };
  const handleDragLeave = () => setIsDroppable(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (gameMode === 'finalPiece') {
      placeFinalPiece();
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLImageElement>) => {
      if (gameMode !== 'finalPiece') return;
      setIsTouchDragging(true);
      const touch = e.touches[0];
      touchStartPosRef.current = { 
          x: touch.clientX - touchTranslate.x, 
          y: touch.clientY - touchTranslate.y 
      };
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLImageElement>) => {
    if (gameMode !== 'finalPiece' || !dropZoneRef.current || !isTouchDragging) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    
    setTouchTranslate({
        x: touch.clientX - touchStartPosRef.current.x,
        y: touch.clientY - touchStartPosRef.current.y,
    });

    const dropZoneRect = dropZoneRef.current.getBoundingClientRect();
    const isOver = (
        touch.clientX >= dropZoneRect.left &&
        touch.clientX <= dropZoneRect.right &&
        touch.clientY >= dropZoneRect.top &&
        touch.clientY <= dropZoneRect.bottom
    );
    
    setIsDroppable(isOver);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLImageElement>) => {
      if (gameMode !== 'finalPiece' || !dropZoneRef.current || !isTouchDragging) return;
      
      setIsTouchDragging(false);
      
      const touch = e.changedTouches[0];
      const dropZoneRect = dropZoneRef.current.getBoundingClientRect();
      
      const isOver = (
          touch.clientX >= dropZoneRect.left &&
          touch.clientX <= dropZoneRect.right &&
          touch.clientY >= dropZoneRect.top &&
          touch.clientY <= dropZoneRect.bottom
      );
      
      if (isOver) {
          placeFinalPiece();
      } else {
          setIsDroppable(false);
          setTouchTranslate({ x: 0, y: 0 }); // Snap back
      }
  };

  const boardPadding = 16;
  const gridWidth = boardSize.width - boardPadding;
  const gridHeight = boardSize.height - boardPadding;
  const tileWidth = gridWidth / GRID_SIZE;
  const tileHeight = gridHeight / GRID_SIZE;
  // const dropZoneSize = { width: 343, height: 126 };
  // dynamic puzzle slot size (relative to board size)
  const dropZoneSize = {
    width:  gridWidth  * 0.2766225583,
    height: gridHeight * 0.1799807507,
  };
  // const dropZonePosition = {
  //     top: (GRID_SIZE / 2 - 1) * tileHeight + boardPadding / 2 - 69,
  //     left: (GRID_SIZE / 2 - 1) * tileWidth + boardPadding / 2 - 84,
  // };
  // dynamic drop zone 
  const dropZonePosition = {
  left: boardPadding / 2 + gridWidth  * 0.3698802773,
  top:  boardPadding / 2 + gridHeight * 0.3407122233,
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

  const isCompleted = gameMode === 'completed';

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
            isCompleted={isCompleted}
            width={boardSize.width}
            height={boardSize.height}
        />
        
        {gameMode === 'finalPiece' && !isFinalPiecePlaced && (
          <div
            ref={dropZoneRef}
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
        
        {gameMode === 'completed' && <CompletionEffect />}
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
          <div className="text-center animate-fade-in touch-none" style={{ touchAction: 'none' }}>
              <p className="mb-4 text-lg text-slate-300">Place the final piece to complete the puzzle.</p>
              <img
                src={FINAL_PIECE_URL}
                draggable="true"
                onDragStart={(e) => e.dataTransfer.setData('text/plain', 'piece')}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  transform: `translate(${touchTranslate.x}px, ${touchTranslate.y}px) scale(${isTouchDragging ? 1.1 : 1})`,
                  zIndex: isTouchDragging ? 1000 : 'auto',
                  transition: isTouchDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className={`w-[343px] h-[126px] mx-auto cursor-grab active:cursor-grabbing ${isTouchDragging ? 'drop-shadow-[0_10px_25px_rgba(0,255,255,0.5)]' : 'drop-shadow-[0_5px_15px_rgba(0,255,255,0.3)] hover:scale-110'}`}
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