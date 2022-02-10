import React, {useEffect, useState} from 'react';
import './App.css';
import {ICard, PlayingCard, Suit, TexasHoldEmPokerGameType} from 'typedeck';
import Modal from 'react-modal';
import {CardIndex, GameState, SolutionState} from "./zipitaire";
import {solve} from "./solver";


const suitMap = '♣♠♦♥';

const nameMap = 'A234567890JQK'

const cardValue = (card: ICard) => nameMap[card.cardName] === '0' ? 10 : nameMap[card.cardName];

function TextCard(card: PlayingCard) {
    const suit = card.suit;
    const color = ((suit === Suit.Clubs || suit === Suit.Spades) ? 'black' : 'red')
    return <span style={{color}}>
            {cardValue(card) + suitMap[suit]}
        </span>
}

const ROWS = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const BLANKS = ROWS.map(i => new Array(i + 1).fill(0));
const HAND = [45, 46, 47, 48, 49, 50, 51]

function getIx(row: number, col: number) {
    return (row * (row + 1) / 2) + col;
}

const isAvailable = (row : number, col : number, state : GameState) => {
    const {used} = state;
    if(used[row * (row+1) / 2 + col])
        return false;
    if(row > 7)
        return true;
    const ix = (row+1)* (row+2) / 2;
    return used[ix+col] && used[ix+1+col]
}


export const isLegal = (row : number, col : number, state : GameState) => {
    if(!isAvailable(row, col, state)) {
        return false;
    }
    if(row > 8) {
        return true;
    }

    if(state.stack.length === 0) {
        return true;
    }
    const ix = getIx(row, col);
    const cards = state.deck;
    const top = cards[state.stack[state.stack.length-1]];
    const val = state.deck[ix].cardName;

    return val === top.cardName + 1
        || val === top.cardName - 1
        || top.cardName === 0
        || top.cardName === 12;


}

const preventDefault = (f : any) => (e : any) => {
    e.preventDefault();
    e.stopPropagation();
    f(e);
    return false;
}

function HandCard({used, ix, clickCard, cards} :
{used?: boolean[], ix: number, clickCard?: ((offset: number) => () => void), cards: PlayingCard[]})
{
    const className = clickCard ?  "card available" : "card blocked";
    return <span className={className}
                 tabIndex={clickCard && 0}
                 onKeyPress={clickCard && clickCard(ix)}
                 onClick={clickCard && clickCard(ix)}>
        {used && used[ix] ? <span/> : TextCard(cards[ix])}
    </span>;
}

function App() {
    const [deck, setDeck] = useState<ICard[]>();
    const [used, setUsed] = useState(new Array(52).fill(false));
    const [stack, setStack] = useState<CardIndex[]>([]);
    const [solution, setSolution] = useState<SolutionState>("unknown");
    const [modalOpen, setModalOpen] = useState(false);

    const undo = () => {
        const top = stack.pop()!;
        const u = [...used];
        u[top] = false;
        setUsed(u);
    }
    const reset = () => {
        setStack([])
        setUsed(new Array(52).fill(false));
    }
    function shuffle() {
        const d = new TexasHoldEmPokerGameType().createDeck();
        d.shuffle();
        setDeck(d.getCards());
        reset();
    }

    useEffect(() => {
        shuffle();
    }, []);

    useEffect(() => {
        if(used[0]) {
            setModalOpen(true);
        }
    }, [used]);

    if (!deck)
        return null;
    const cards = deck as PlayingCard[];

    const clickCard = (offset : number) => () => {
        const u = [...used];
        u[offset] = true;
        const s = [...stack];
        s.push(offset)
        setUsed(u);
        setStack(s);
    }

    const state = {
        used,
        stack,
        deck
    }
    return (
        <div className="Zipitaire"
            onContextMenu={() => false}
             // onContextMenuCapture={preventDefault(() => {})}
             onAuxClick={preventDefault(undo)}
             onKeyUp={e => e.ctrlKey && e.key === 'z' && undo()}>
            <div className="tableau">
                {ROWS.map((row) =>
                    <div className="row" key={row}>
                        {BLANKS[row].map((x, col) => {
                            const offset = row * (row + 1) / 2 + col
                            return <HandCard
                                used={used}
                                key={offset}
                                ix={offset}
                                clickCard={isLegal(row, col, state) ? clickCard : undefined}
                                cards={cards}/>
                        })
                        }
                    </div>
                )}
            </div>
            <hr/>
            <div className="hand">
                {HAND.map((ix, i) =>
                <HandCard
                    used={used}
                    key={ix}
                    ix={ix}
                    clickCard={isLegal(9, i, state) ? clickCard : undefined}
                    cards={cards}/>)}
            </div>
            <hr/>
            <div className="pile">
                {stack.length === 0 ? <span/> : TextCard(cards[stack[stack.length - 1]])}
            </div>
            <button onClick={undo} disabled={stack.length === 0}>Undo</button>
            <button onClick={reset} disabled={stack.length === 0}>Reset</button>
            <button onClick={() => {
                setSolution("working")
                setTimeout(() =>
                setSolution(solve(state)), 0);
            }}>Solve</button>
            <div>
                {solution === "unknown" ? null
                    : solution === "none" ? "No solution found"
                    : solution === "working" ? "Working..."
                    : solution.map(card => <HandCard key={card} ix={card} cards={cards}/>)
                    }
            </div>
            <div className="instructions">
                <h3>Instructions</h3>
                <p>You may begin with any card in the bottom row of the pyramid
                    or in your hand (below the pyramid).</p>
                <p>Continue with any uncovered card that is 1 higher or 1 lower than the
                top of the pile. If the top of the pile is an Ace or King, you may
                play any uncovered card.</p>
                <p>You win when you have cleared the pyramid.</p>
            </div>
            <Modal
                isOpen={modalOpen}
                onRequestClose={ () => setModalOpen(false)}>
                You win!
                <button onClick={() => {
                    setModalOpen(false)
                    shuffle()
                }}>New game</button>
            </Modal>
        </div>
    );
}

export default App;
