import {IDeck} from "typedeck";

export type CardIndex = number;
export type GameState = {
    deck: IDeck;
    used: boolean[];
    stack: CardIndex[];
}
export type SolutionState = CardIndex[] | "unknown" | "none" | "working";