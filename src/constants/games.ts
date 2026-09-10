export interface GameConfig {
  id: string;
  title: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  modes: string[];
  entryFees: number[];
  turnTimeoutSec: number;
  isActive: boolean;
}

export const GAMES_CATALOG: GameConfig[] = [
  {
    id: 'ludo',
    title: 'Ludo Express',
    description: 'Classic 4-player board game of tokens, dice rolls, and home runs.',
    minPlayers: 2,
    maxPlayers: 4,
    modes: ['classic', 'quick', 'timer', 'rush'],
    entryFees: [0, 10, 50, 100, 500],
    turnTimeoutSec: 15,
    isActive: true,
  },
  {
    id: 'chess',
    title: 'Chess Blitz',
    description: 'Strategic royal battlefield. Checkmate your opponent in rapid time.',
    minPlayers: 2,
    maxPlayers: 2,
    modes: ['bullet_1m', 'blitz_3m', 'rapid_10m', 'custom'],
    entryFees: [0, 20, 100, 250],
    turnTimeoutSec: 60,
    isActive: true,
  },
  {
    id: 'uno',
    title: 'Color Cards Uno',
    description: 'Fast-paced card matching game. Match colors, numbers, and drop Wild +4!',
    minPlayers: 2,
    maxPlayers: 4,
    modes: ['classic', 'quick', 'rush'],
    entryFees: [0, 10, 50, 100],
    turnTimeoutSec: 12,
    isActive: true,
  },
  {
    id: 'snakes_and_ladders',
    title: 'Snakes & Ladders',
    description: 'Roll the dice, climb ladders, beware of lurking snakes to reach 100.',
    minPlayers: 2,
    maxPlayers: 4,
    modes: ['classic', 'quick', 'rush'],
    entryFees: [0, 10, 25, 50],
    turnTimeoutSec: 15,
    isActive: true,
  },
  {
    id: 'chidiya_udd',
    title: 'Chidiya Udd Rush',
    description: 'Lightning reflex finger tapping game. Fly birds, keep animals grounded!',
    minPlayers: 2,
    maxPlayers: 4,
    modes: ['quick', 'survival', 'rush'],
    entryFees: [0, 5, 20, 50],
    turnTimeoutSec: 3,
    isActive: true,
  },
  {
    id: 'esto',
    title: 'Esto (Ashta Chamma)',
    description: 'Traditional Indian strategy race game with cowrie shells and pawns.',
    minPlayers: 2,
    maxPlayers: 4,
    modes: ['classic', 'traditional', 'quick'],
    entryFees: [0, 15, 50, 150],
    turnTimeoutSec: 20,
    isActive: true,
  },
];
