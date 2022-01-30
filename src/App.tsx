import React, {useEffect, useState} from 'react';
import './App.css';
import {ICard, IDeck, PlayingCard, Suit, TexasHoldEmPokerGameType} from 'typedeck';
import Modal from 'react-modal';


const suitMap = '♣♠♦♥';

const nameMap = 'A234457890JQK'

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

function HandCard({used, ix, clickCard, cards} :
{used: any[], ix: number, clickCard: ((offset: number) => () => void) | undefined, cards: PlayingCard[]})
{
    const className = clickCard ?  "card available" : "card blocked";
    return <span className={className}
                 tabIndex={clickCard && 0}
                 onKeyPress={clickCard && clickCard(ix)}
                 onClick={clickCard && clickCard(ix)}>
        {used[ix] ? <span/> : TextCard(cards[ix])}
    </span>;
}


function App() {
    const [deck, setDeck] = useState<IDeck>();
    const [used, setUsed] = useState(new Array(52).fill(false));
    const [stack, setStack] = useState<CardIndex[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

    const isAvailable = (row : number, col : number) => {
        if(used[row * (row+1) / 2 + col])
            return false;
        if(row > 7)
            return true;
        const ix = (row+1)* (row+2) / 2;
        return used[ix+col] && used[ix+1+col]
    }

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

    return (
        <div className="Zipitaire"
             onAuxClick={e => e.button === 1 && undo()}
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
                                clickCard={isAvailable(row, col) ? clickCard : undefined}
                                cards={cards}/>
                        })
                        }
                    </div>
                )}
            </div>
            <hr/>
            <div className="hand">
                {HAND.map(ix =>
                <HandCard
                    used={used}
                    key={ix}
                    ix={ix}
                    clickCard={used[ix] ? undefined : clickCard}
                    cards={cards}/>)}
            </div>
            <hr/>
            <div>
                {stack.length === 0 ? <span/> : TextCard(cards[stack[stack.length - 1]])}
            </div>
            <button onClick={undo} disabled={stack.length === 0}>Undo</button>
            <button onClick={reset} disabled={stack.length === 0}>Reset</button>
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
