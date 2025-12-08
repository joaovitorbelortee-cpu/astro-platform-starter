import { useEffect, useMemo, useRef, useState } from 'react';

type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

type Cell = { x: number; y: number };

const BOARD_SIZE = 15;
const START_LENGTH = 3;
const MOVE_INTERVAL = 140;

const randomCell = (blocked: Set<string>) => {
    let x: number;
    let y: number;

    do {
        x = Math.floor(Math.random() * BOARD_SIZE);
        y = Math.floor(Math.random() * BOARD_SIZE);
    } while (blocked.has(`${x}-${y}`));

    return { x, y } satisfies Cell;
};

const nextDirection = (current: Direction, incoming: Direction) => {
    const isOpposite =
        (current === 'ArrowUp' && incoming === 'ArrowDown') ||
        (current === 'ArrowDown' && incoming === 'ArrowUp') ||
        (current === 'ArrowLeft' && incoming === 'ArrowRight') ||
        (current === 'ArrowRight' && incoming === 'ArrowLeft');

    return isOpposite ? current : incoming;
};

export default function SnakeGame() {
    const [snake, setSnake] = useState<Cell[]>(() => {
        const startX = Math.floor(BOARD_SIZE / 2);
        const startY = Math.floor(BOARD_SIZE / 2);
        return Array.from({ length: START_LENGTH }, (_, index) => ({ x: startX - index, y: startY }));
    });
    const [direction, setDirection] = useState<Direction>('ArrowRight');
    const [food, setFood] = useState<Cell>(() => {
        const occupied = new Set(
            Array.from({ length: START_LENGTH }, (_, index) => `${Math.floor(BOARD_SIZE / 2) - index}-${Math.floor(BOARD_SIZE / 2)}`)
        );
        return randomCell(occupied);
    });
    const [isRunning, setIsRunning] = useState(true);
    const [isGameOver, setIsGameOver] = useState(false);
    const moveTimer = useRef<number | null>(null);

    const score = snake.length - START_LENGTH;

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            const keys: Direction[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (!keys.includes(event.key as Direction)) return;

            event.preventDefault();
            setDirection((prev) => nextDirection(prev, event.key as Direction));
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => {
        if (!isRunning || isGameOver) return;

        moveTimer.current = window.setInterval(() => {
            setSnake((currentSnake) => {
                const [head] = currentSnake;
                const effectiveDirection = direction;

                const delta = {
                    ArrowUp: { x: 0, y: -1 },
                    ArrowDown: { x: 0, y: 1 },
                    ArrowLeft: { x: -1, y: 0 },
                    ArrowRight: { x: 1, y: 0 }
                }[effectiveDirection];

                const newHead = { x: head.x + delta.x, y: head.y + delta.y } satisfies Cell;

                const snakeSet = new Set(currentSnake.map((segment) => `${segment.x}-${segment.y}`));
                const hitWall = newHead.x < 0 || newHead.y < 0 || newHead.x >= BOARD_SIZE || newHead.y >= BOARD_SIZE;
                const hitSelf = snakeSet.has(`${newHead.x}-${newHead.y}`);

                if (hitWall || hitSelf) {
                    setIsGameOver(true);
                    setIsRunning(false);
                    return currentSnake;
                }

                const hasEaten = newHead.x === food.x && newHead.y === food.y;
                const newSnake = [newHead, ...currentSnake];

                if (!hasEaten) {
                    newSnake.pop();
                } else {
                    const blocked = new Set(newSnake.map((segment) => `${segment.x}-${segment.y}`));
                    setFood(randomCell(blocked));
                }

                return newSnake;
            });
        }, MOVE_INTERVAL);

        return () => {
            if (moveTimer.current) {
                clearInterval(moveTimer.current);
            }
        };
    }, [isRunning, isGameOver, food, direction]);

    const boardCells = useMemo(() => {
        const snakeSet = new Set(snake.map((segment) => `${segment.x}-${segment.y}`));
        const headKey = `${snake[0].x}-${snake[0].y}`;

        return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
            const x = index % BOARD_SIZE;
            const y = Math.floor(index / BOARD_SIZE);
            const key = `${x}-${y}`;
            const isHead = key === headKey;
            const isSnake = snakeSet.has(key);
            const isFood = x === food.x && y === food.y;

            return { x, y, key, isHead, isSnake, isFood };
        });
    }, [snake, food]);

    const resetGame = () => {
        const startX = Math.floor(BOARD_SIZE / 2);
        const startY = Math.floor(BOARD_SIZE / 2);
        const initialSnake = Array.from({ length: START_LENGTH }, (_, index) => ({ x: startX - index, y: startY }));

        setSnake(initialSnake);
        setDirection('ArrowRight');
        setFood(randomCell(new Set(initialSnake.map((segment) => `${segment.x}-${segment.y}`))));
        setIsRunning(true);
        setIsGameOver(false);
    };

    const toggleRunning = () => setIsRunning((current) => !current);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 text-base font-semibold rounded-lg bg-black/40">Score: {score}</div>
                <div className="px-4 py-2 text-base font-semibold rounded-lg bg-black/40">Direction: {direction.replace('Arrow', '')}</div>
                <div
                    className={`px-4 py-2 text-base font-semibold rounded-lg ${
                        isGameOver ? 'bg-red-500/80 text-white' : isRunning ? 'bg-emerald-500/80 text-white' : 'bg-amber-400/80 text-gray-900'
                    }`}
                >
                    {isGameOver ? 'Fim de jogo' : isRunning ? 'Rodando' : 'Pausado'}
                </div>
            </div>

            <div
                className="grid gap-1 p-3 rounded-xl shadow-lg bg-slate-900/60 border border-white/10"
                style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
                role="grid"
                aria-label="Tabuleiro do jogo da cobrinha"
            >
                {boardCells.map(({ key, isHead, isSnake, isFood }) => {
                    const baseClass = 'aspect-square rounded-md transition-all duration-150';
                    let cellClass = 'bg-slate-800/80 border border-white/5';

                    if (isFood) {
                        cellClass = 'bg-primary shadow-[0_0_12px_rgba(246,114,128,0.7)]';
                    } else if (isHead) {
                        cellClass = 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]';
                    } else if (isSnake) {
                        cellClass = 'bg-emerald-700/90';
                    }

                    return <div key={key} className={`${baseClass} ${cellClass}`} role="gridcell" aria-label={cellClass} />;
                })}
            </div>

            <div className="flex flex-wrap gap-3">
                <button className="btn" onClick={toggleRunning} disabled={isGameOver}>
                    {isRunning ? 'Pausar' : 'Retomar'}
                </button>
                <button className="btn" onClick={resetGame}>
                    Reiniciar
                </button>
            </div>

            <div className="p-4 rounded-lg bg-black/30 border border-white/5">
                <p className="mb-2 font-semibold">Como jogar</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-200">
                    <li>Use as setas do teclado para mudar a direção da cobrinha.</li>
                    <li>Coma a fruta rosa para crescer e aumentar sua pontuação.</li>
                    <li>Evite bater nas bordas ou em si mesma.</li>
                    <li>Use "Pausar" para dar um tempo e "Reiniciar" para começar de novo.</li>
                </ul>
            </div>
        </div>
    );
}
