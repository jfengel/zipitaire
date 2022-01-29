import React, {useEffect, useState} from 'react';
import './App.css';
import {ICard, IDeck, PlayingCard, Suit, TexasHoldEmPokerGameType} from 'typedeck';


const suitMap = '♣♠♦♥';

const nameMap = 'A234457890JQK'

const cardValue = (card: ICard) => nameMap[card.cardName] === '0' ? 10 : nameMap[card.cardName];

function Card(card: PlayingCard) {
    const suit = card.suit;
    const color = ((suit === Suit.Clubs || suit === Suit.Spades) ? 'black' : 'red')
    return <span style={{color}} className="card">
            {cardValue(card) + suitMap[suit]}
        </span>
}

const ROWS = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const BLANKS = ROWS.map(i => new Array(i + 1).fill(0));



function App() {
    const [deck, setDeck] = useState<IDeck>();
    const [used, setUsed] = useState(new Array(52).fill(false));
    const [stack, setStack] = useState<number[]>([]);

    const isAvailable = (row : number, col : number) => {
        if(row > 7)
            return true;
        const r = (row+1)* (row+2) / 2;
        return used[r+col] && used[r+1+col]
    }

    function shuffle() {
        const d = new TexasHoldEmPokerGameType().createDeck();
        d.shuffle();
        setDeck(d);
    }

    useEffect(() => {
        shuffle();
    }, []);

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
                            const offset = row*(row+1)/2+i
                            if(used[offset]) {
                                return <span key={i} className="card"/>
                            }
                            return <span key={i}
                                         className={isAvailable(row, i) ? "available" : "blocked"}
                                         onClick={isAvailable(row, i) ? clickCard(offset) : undefined}
                            >
                                {Card(cards[offset])}
                            </span>})
                        }
                    </div>
                )}
            </div>
            <hr/>
            <div className="hand">
                <span className={used[45] ? "blocked" : "available"} onClick={clickCard(45)}>{used[45] ? <span className="card"/> : Card(cards[45])}</span>
                {Card(cards[46])}
                {Card(cards[47])}
                {Card(cards[48])}
                {Card(cards[49])}
                {Card(cards[50])}
                {Card(cards[51])}
            </div>
            <hr/>
            <div>
                {stack.length === 0 ? <span/> : Card(cards[stack[stack.length-1]])}
            </div>
            <button onClick={shuffle}>Shuffle</button>
        </div>
    );
}

export default App;
