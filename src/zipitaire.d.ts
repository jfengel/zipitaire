export type CardIndex = number;
export type GameState = {
    deck: ICard[];
    used: boolean[];
    stack: CardIndex[];
}
export type SolutionState = CardIndex[] | "unknown" | "none" | "working";