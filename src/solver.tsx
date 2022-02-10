import {GameState, SolutionState} from "./zipitaire";
import {isLegal} from "./App";

export const solve = (state: GameState): SolutionState => {
    const solution = solveRecurse(state, 0);
    if (typeof solution === "string")
        return solution;
    else
        return solution.reverse();
}
const solveRecurse = (state: GameState, depth: number): SolutionState => {
    if (depth > 44) {
        return [];
    }
    if (state.used[0]) {
        return [];
    }
    let row = 0;
    let col = 0;
    for (let i = 0; i < 52; i++) {
        if (isLegal(row, col, state)) {
            const top = state.stack[state.stack.length - 1];
            if (i >= 45 && top >= 45) {
                continue;   // You never need to play two hand cards in a row
            }

            state.stack.push(i);
            state.used[i] = true;


            const solution = solveRecurse(state, depth + 1);
            state.stack.pop();
            state.used[i] = false;

            if (typeof solution === "object") {
                solution.push(i);
                return solution;
            }
        }
        col++;
        if (col > row) {
            row++;
            col = 0;
        }
    }
    return "none";
}