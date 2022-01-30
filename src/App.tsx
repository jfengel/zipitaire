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
    return <span style={{color}} className="card">
            {cardValue(card) + suitMap[suit]}
        </span>
}

const ROWS = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const BLANKS = ROWS.map(i => new Array(i + 1).fill(0));
const HAND = [45, 46, 47, 48, 49, 50, 51]

type CardIndex = number;

function HandCard({used, ix, clickCard, cards} :
{used: any[], ix: number, clickCard: (offset: number) => () => void, cards: PlayingCard[]})
{
    return <span className={used[ix] ? "blocked" : "card available"} onClick={clickCard(ix)}>{used[ix] ?
        <span className="card"/> : TextCard(cards[ix])}</span>;
}


function App() {
    const [deck, setDeck] = useState<IDeck>();
    const [used, setUsed] = useState(new Array(52).fill(false));
    const [stack, setStack] = useState<CardIndex[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

    const isAvailable = (row : number, col : number) => {
        if(row > 7)
            return true;
        const r = (row+1)* (row+2) / 2;
        return used[r+col] && used[r+1+col]
    }

    const undo = () => {
        const top = stack.pop()!;
        const u = [...used];
        u[top] = false;
        setUsed(u);
    }
    function shuffle() {
        const d = new TexasHoldEmPokerGameType().createDeck();
        d.shuffle();
        setDeck(d);
        setUsed(new Array(52).fill(false));
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
        <div className="Zipitaire">
            <div className="tableau">
                {ROWS.map((row) =>
                    <div className="row" key={row}>
                        {BLANKS[row].map((x, i) => {
                            const offset = row * (row + 1) / 2 + i
                            if (used[offset]) {
                                return <span key={i} className="card"/>
                            }
                            return
                            <span key={i}
                                         className={isAvailable(row, i) ? "available" : "blocked"}
                                         onClick={isAvailable(row, i) ? clickCard(offset) : undefined}
                            >
                                {TextCard(cards[offset])}
                            </span>
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
                    clickCard={clickCard}
                    cards={cards}/>)}
            </div>
            <hr/>
            <div>
                {stack.length === 0 ? <span/> : TextCard(cards[stack[stack.length - 1]])}
            </div>
            <button onClick={undo} disabled={stack.length === 0}>Undo</button>
            <Modal
                isOpen={modalOpen}
                onRequestClose={ () => setModalOpen(false)}>
                You win!
                <button onClick={() => setModalOpen(false)}>New game</button>
            </Modal>
        </div>
    );
}

export default App;
