import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tile } from './types';
import { GRID_SIZE, TILE_COUNT, EMPTY_TILE_ID, IMAGE_URL, FINAL_PIECE_URL, FINAL_PIECE_SNAP_SOUND_URL, PUZZLE_COMPLETED_SOUND_URL } from './constants';
import PuzzleBoard from './components/PuzzleBoard';
import CompletionEffect from './components/CompletionEffect';
import { PuzzleIcon, ShuffleIcon } from './components/Icons';

type GameMode = 'sliding' | 'finalPiece' | 'completed';

const App: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [boardSize, setBoardSize] = useState({ width: 800, height: 450 });
  
  const [gameMode, setGameMode] = useState<GameMode>('sliding');
  const [isDroppable, setIsDroppable] = useState(false);
  const [isFinalPiecePlaced, setIsFinalPiecePlaced] = useState(false);

  const [showPlayAgain, setShowPlayAgain] = useState(false);

  // Touch drag state
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchTranslate, setTouchTranslate] = useState({ x: 0, y: 0 });
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const finalPieceSnapAudioRef = useRef<HTMLAudioElement | null>(null);
  const puzzleCompletedAudioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const isMounted = useRef(true);


  useEffect(() => {
    const calculateBoardSize = () => {
      const mainPadding = 16; // p-2 on main container (8px each side)
      const controlsAreaHeight = 120; // Fixed height of the controls div
      const controlsMarginTop = 8; // mt-2 on controls div
      
      const availableWidth = window.innerWidth - mainPadding;
      const availableHeight = window.innerHeight - mainPadding - controlsAreaHeight - controlsMarginTop;

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

  useEffect(() => {
    isMounted.current = true;
    // Preload all audio files to reduce latency and prepare for playback.
    finalPieceSnapAudioRef.current = new Audio(FINAL_PIECE_SNAP_SOUND_URL);
    finalPieceSnapAudioRef.current.preload = 'auto';

    puzzleCompletedAudioRef.current = new Audio(PUZZLE_COMPLETED_SOUND_URL);
    puzzleCompletedAudioRef.current.preload = 'auto';
    
    // Cleanup timers on unmount
    return () => {
      isMounted.current = false;
      timersRef.current.forEach(window.clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (gameMode === 'completed') {
      if (puzzleCompletedAudioRef.current) {
        puzzleCompletedAudioRef.current.currentTime = 0;
        puzzleCompletedAudioRef.current.play().catch(e => console.warn("Puzzle completion sound failed to play.", e));
      }
      // CompletionEffect animation is ~3.5s. Show play again button after.
      const timer = setTimeout(() => {
        if(isMounted.current) {
          setShowPlayAgain(true);
        }
      }, 3500); 

      return () => clearTimeout(timer);
    }
  }, [gameMode]);

  const onPuzzleSolved = useCallback(() => {
    setIsSolved(true);
    setIsBusy(true); // Prevent clicks during transition
    setTimeout(() => {
      setGameMode('finalPiece');
      setIsBusy(false);
    }, 1000); // 1 second delay to show solved board before final piece step
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
      if (checkSolved(newTiles)) {
        onPuzzleSolved();
      }
    }
  }, [tiles, isBusy, isSolved, checkSolved, onPuzzleSolved]);
  
  const handlePlayAgain = useCallback(async () => {
    // 0. Reset State
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
    
    setGameMode('sliding');
    setIsFinalPiecePlaced(false);
    setShowPlayAgain(false);
    setIsBusy(true);
    setIsSolved(false);
    setIsSolving(false);

    // 1. Scatter the puzzle
    let currentTiles = createSolvedGrid();
    setTiles(currentTiles);
    await new Promise(resolve => setTimeout(resolve, 100));

    const path: number[] = []; // Stores the index of the empty tile for each move
    let emptyIndex = EMPTY_TILE_ID;
    path.push(emptyIndex);
    
    const shuffleDuration = 33000; // Increased to 33s as requested
    const moveInterval = 20; // Reduced from 30ms for faster tile movement
    const numMoves = Math.floor(shuffleDuration / moveInterval);

    for (let i = 0; i < numMoves; i++) {
        if (!isMounted.current) return;
        const neighbors: number[] = [];
        const { row, col } = { row: Math.floor(emptyIndex / GRID_SIZE), col: emptyIndex % GRID_SIZE };

        if (row > 0) neighbors.push(emptyIndex - GRID_SIZE);
        if (row < GRID_SIZE - 1) neighbors.push(emptyIndex + GRID_SIZE);
        if (col > 0) neighbors.push(emptyIndex - 1);
        if (col < GRID_SIZE - 1) neighbors.push(emptyIndex + 1);
        
        const lastPos = path.length > 1 ? path[path.length - 2] : -1;
        const validNeighbors = neighbors.filter(n => n !== lastPos);
        const moveCandidates = validNeighbors.length > 0 ? validNeighbors : neighbors;
        
        const moveIndex = moveCandidates[Math.floor(Math.random() * moveCandidates.length)];
        
        [currentTiles[emptyIndex], currentTiles[moveIndex]] = [currentTiles[moveIndex], currentTiles[emptyIndex]];
        emptyIndex = moveIndex;
        path.push(emptyIndex);
        
        setTiles([...currentTiles]);
        await new Promise(resolve => setTimeout(resolve, moveInterval));
    }

    if (!isMounted.current) return;
    
    // 2. Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (!isMounted.current) return;

    // 3. Solve the puzzle by reversing the shuffle path
    setIsSolving(true);
    const solveMoveInterval = 5; // Solve faster than shuffling
    for (let i = path.length - 1; i > 0; i--) {
        if (!isMounted.current) return;
        const currentEmptyIndex = path[i];
        const prevEmptyIndex = path[i - 1];
        
        [currentTiles[currentEmptyIndex], currentTiles[prevEmptyIndex]] = [currentTiles[prevEmptyIndex], currentTiles[currentEmptyIndex]];
        
        setTiles([...currentTiles]);
        await new Promise(resolve => setTimeout(resolve, solveMoveInterval));
    }

    if (!isMounted.current) return;

    // 4. Start "Place the final piece" step
    setIsSolving(false);
    onPuzzleSolved();
    
  }, [createSolvedGrid, onPuzzleSolved]);


  useEffect(() => {
    if (imageLoaded) {
      handlePlayAgain();
    }
  }, [imageLoaded, handlePlayAgain]);

  const placeFinalPiece = useCallback(() => {
    setIsDroppable(false);
    setIsFinalPiecePlaced(true);

    if (finalPieceSnapAudioRef.current) {
      finalPieceSnapAudioRef.current.currentTime = 0;
      finalPieceSnapAudioRef.current.play().catch(e => console.warn("Final piece snap sound failed to play.", e));
    }

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
  // dynamic puzzle slot size (relative to board size)
  const dropZoneSize = {
    width:  gridWidth  * 0.2766225583,
    height: gridHeight * 0.1799807507,
  };
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-2 selection:bg-cyan-500 selection:text-cyan-900 overflow-hidden">
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

      <div className="mt-2 flex flex-col justify-center items-center" style={{ height: '120px' }}>
        {gameMode === 'finalPiece' && !isFinalPiecePlaced && (
          <div className="text-center animate-fade-in touch-none" style={{ touchAction: 'none' }}>
              <p className="mb-4 text-lg text-slate-300"> </p>
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

        {showPlayAgain && (
            <div className="animate-fade-in">
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