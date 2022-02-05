import React, {useEffect, useState} from 'react';
import './App.css';
import {ICard, IDeck, PlayingCard, Suit, TexasHoldEmPokerGameType} from 'typedeck';
import Modal from 'react-modal';


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

type CardIndex = number;

type GameState = {
    deck : IDeck;
    used : boolean[];
    stack : CardIndex[];
}

const solve = (state : GameState) : CardIndex[] | null => {
    const avail = [];
    for(let row = 8; row <= 9; row++) {
        for(let col = 0; col < (row === 8 ? 9 : 7); col++) {
            avail.push([row, col]);
        }
    }
    return solveRecurse(state, avail, 0);
}

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


const isLegal = (row : number, col : number, state : GameState) => {
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
    const cards = state.deck.getCards();
    const top = cards[state.stack[state.stack.length-1]];
    const val = state.deck.getCards()[ix].cardName;

    if(val === top.cardName+1
        || val === top.cardName-1
        || top.cardName === 0
        || top.cardName === 12) {
        return true;
    }

    return false;
}

const solveRecurse = (state : GameState, avail : number[][], depth : number) : CardIndex[] | null => {
    if(depth > 11) {
        return [];
    }
    if(state.used[0]) {
        return [];
    }
    for(let i = 0; i < avail.length; i++) {
        const card = avail[i];
        const [row, col] = card;
        if(isLegal(row, col, state)) {
            const newAvail = [...avail]
            avail.splice(i);
            if(col > 0) {
                if(state.used[getIx(row, col-1)]) {
                    avail.push([row, col-1])
                }
            }
            if(col < row) {
                if(state.used[getIx(row, col+1)]) {
                    avail.push([row, col])
                }
            }
            const ix = getIx(row, col);
            const stack = [...state.stack];
            stack.push(ix);
            const used = [...state.used];
            used[ix] = true;
            const newState = {...state,
                used,
                stack
            }
            const solution = solveRecurse(newState, newAvail,depth+1);
            if(solution) {
                solution.push(ix);
                return solution;
            }
        }
    }
    return null;
}

const preventDefault = (f : any) => (e : any) => {
    console.info("received", e, f);
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
    const [deck, setDeck] = useState<IDeck>();
    const [used, setUsed] = useState(new Array(52).fill(false));
    const [stack, setStack] = useState<CardIndex[]>([]);
    const [solution, setSolution] = useState<CardIndex[] | null>(null);
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
        setDeck(d);
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
    const cards = deck.getCards() as PlayingCard[];

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
             onContextMenuCapture={preventDefault(() => {})}
             onAuxClick={e => { e.preventDefault(); e.stopPropagation(); undo();}}
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
            <div>
                {stack.length === 0 ? <span/> : TextCard(cards[stack[stack.length - 1]])}
            </div>
            <button onClick={undo} disabled={stack.length === 0}>Undo</button>
            <button onClick={reset} disabled={stack.length === 0}>Reset</button>
            <button onClick={() => setSolution(solve(state))}>Solve</button>
            <div>
                {solution?.map(card => <HandCard key={card} ix={card} cards={cards}/>)}
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
