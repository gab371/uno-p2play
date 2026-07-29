import type { GameConfig, HouseRulesConfig } from "./types";

export const UNO_CALL_WINDOW_MS = 3000;

export const DEFAULT_HOUSE_RULES: HouseRulesConfig = {
  stacking: false,
  sevenZero: false,
  jumpIn: false,
  forcePlay: false,
  drawToMatch: false,
  noBluffing: false,
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  mode: "CLASSIC",
  houseRules: { ...DEFAULT_HOUSE_RULES },
  scoreLimit: 500,
};

export const HOUSE_RULE_DEFS = [
  {
    id: "stacking" as const,
    label: "Stacking",
    description: "Empiler +2 / +4 pour passer la pénalité au suivant.",
  },
  {
    id: "sevenZero" as const,
    label: "Règle du 7 et du 0",
    description: "7 = échange de mains ; 0 = rotation de toutes les mains.",
  },
  {
    id: "jumpIn" as const,
    label: "À la volée",
    description: "Jouer hors-tour une carte strictement identique.",
  },
  {
    id: "forcePlay" as const,
    label: "Force Play",
    description: "Une carte piochée jouable doit être jouée.",
  },
  {
    id: "drawToMatch" as const,
    label: "Draw to Match",
    description: "Piocher jusqu'à obtenir une carte jouable.",
  },
  {
    id: "noBluffing" as const,
    label: "No Bluffing",
    description: "Pas de challenge sur les Wild +4.",
  },
] as const;
