/* PLAN
MVP4: persistent deck / new hand button + minor stats
MVP5: Betting & money system
MVP6: advanced actions like Double or Split
MVP7: polish ?
*/

class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
    }

    get text() {
        return `[${this.rank}${this.suit}]`;
    }

    get value() {
        if (this.rank === "A") return 11;
        if (["K", "Q", "J"].includes(this.rank)) return 10;
        return Number(this.rank);
    }
}

const drawCardBtn = document.getElementById("drawCardBtn");
const stopPlayBtn = document.getElementById("stopPlayBtn");
const newGameBtn = document.getElementById("newGameBtn");
const newPlayBtn = document.getElementById("newPlayBtn");
const sumEl = document.getElementById("sum-el");
const cardsEl = document.getElementById("cards-el");
const dealerCardsEl = document.getElementById("dealerCards-el");
const playerEl = document.getElementById("player-el");
const deckInfoEl = document.getElementById("deckInfo");
const statsEl = document.getElementById("statsAreaEl");

newGameBtn.addEventListener('click', startGame);
drawCardBtn.addEventListener('click', drawCard);
stopPlayBtn.addEventListener('click', stopPlay);
newPlayBtn.addEventListener('click', newPlay);

let playState = { 
    player: {
        cards: [],
        sum: 0
    },
    dealer: {
        cards: [],
        sum: 0
    }
};
let dealerStarted = false;
let gameState = { deck: [], cutCardIndex: 0 };

let statistics = {
    roundsPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    playerBlackjacks: 0,
    dealerBlackjacks: 0
};

// ============ FUNCTIONS START HERE ===================
function startGame() {
    dealerStarted = false;
    initDeck();
    disableActionButtons(false);
    
    document.getElementById("gameArea").style.display = "block";
    newPlay();
}

function newPlay() {
    newPlayBtn.disabled = true;
    if (gameState.deck.length <= 52 - gameState.cutCardIndex) {
        initDeck();
        playerEl.textContent = "Deck reshuffled";
    } else {
        playerEl.textContent = "";
    }

    // init current player hand
    playState.player.cards.length = 0;
    playState.player.cards.push(gameState.deck.pop());
    playState.player.cards.push(gameState.deck.pop());

    // dealer hand
    playState.dealer.cards.length = 0;
    playState.dealer.cards.push(gameState.deck.pop());
    playState.dealer.cards.push(gameState.deck.pop());
    dealerCardsEl.textContent = playState.dealer.cards[0].text + "[?]";

    renderPlayer();
    disableActionButtons(false);
    dealerStarted = false;
}

function drawCard() {
    if (drawCardBtn.disabled) {
        return;
    }

    playState.player.cards.push(gameState.deck.pop());
    renderPlayer();
}

function stopPlay() {
    disableActionButtons(true);
    if (! dealerStarted) {
        setTimeout(dealerTurn, 1000);
    }
}

// ---------- INTERNAL FUNCTIONS ----------
function dealerTurn() {
    dealerStarted = true;
    // display cards
    dealerCardsEl.classList.add("card-flash");
    renderCards(dealerCardsEl, playState.dealer.cards);
    playState.dealer.sum = calculateHandValue(playState.dealer.cards);
    setTimeout(() => { dealerCardsEl.classList.remove("card-flash"); }, 800);

    // check status
    if (playState.dealer.sum >= 17) {
        finishRound();
        return;
    }

    setTimeout(() => {
        playState.dealer.cards.push(gameState.deck.pop());
        dealerTurn(); 
    }, 800);
}

function renderCards(domElement, cardsArray) {
    deckInfoEl.textContent = "🂠 " + gameState.deck.length;
    let cardsText = "";
    for (const element of cardsArray) {
        cardsText += element.text; 
    }
    domElement.textContent = cardsText;
}

function calculateHandValue(cardsArray) {
    let sum = 0;
    let aceCount = 0;
    for (const element of cardsArray) {
        sum += element.value;
        if (element.rank === "A") aceCount++;
    }

    while (sum > 21 && aceCount) {
        sum -= 10;
        aceCount--;
    }

    return sum;
}

function renderPlayer() {
    renderCards(cardsEl, playState.player.cards);
    playState.player.sum = calculateHandValue(playState.player.cards);
    sumEl.textContent = playState.player.sum;

    if (playState.player.sum > 21) {
        disableActionButtons(true);
        finishRound();
    }

    if (playState.player.sum === 21) {
        if (playState.player.cards.length === 2) {
            playerEl.textContent = "You have a Blackjack !";
        }

        disableActionButtons(true);
        setTimeout(dealerTurn, 1000);  
    }

}

function disableActionButtons(state) {
    drawCardBtn.disabled = state;
    stopPlayBtn.disabled = state;
}

function isBlackjack(hand) {
    return hand.cards.length === 2 && hand.sum === 21;
}

function finishRound() {
    let msg = "";
    let gameWinner = "player";
    if (playState.player.sum > 21) {
        msg = "You bust !"
        gameWinner = "dealer";
    }
    else if (playState.dealer.sum > 21) {
        msg = "Dealer busted ! You won this hand";
    }
    else if (playState.player.sum > playState.dealer.sum) {
        msg = `You won with ${playState.player.sum} against dealer ${playState.dealer.sum}`;
    } else if (playState.player.sum < playState.dealer.sum) {
        msg = `You lost with ${playState.player.sum} against dealer ${playState.dealer.sum}`;
        gameWinner = "dealer";
    } else {
        if (isBlackjack(playState.player) && !isBlackjack(playState.dealer)) {
            msg = `You won with your Blackjack !`;
        } else {
            msg = `DRAW ! Same cards values: ${playState.player.sum}`;
            gameWinner = "draw";
        }
    }

    compileStats(gameWinner);
    playerEl.textContent = msg;
    newPlayBtn.disabled = false;
    newPlayBtn.removeAttribute("style");;
}

function compileStats(gameWinner) {
    statistics.roundsPlayed++;
    switch (gameWinner) {
        case "player":
            statistics.wins++;
            break;
    
        case "dealer":
            statistics.losses++;
            break;
        
        case "draw":
            statistics.draws++;
            break;
    }

    if (isBlackjack(playState.player)) {
        statistics.playerBlackjacks++;
    }
    if (isBlackjack(playState.dealer)) {
        statistics.dealerBlackjacks++;
    }

    let info = "";
    for (const key in statistics) {
        if (Object.prototype.hasOwnProperty.call(statistics, key)) {
            info += `<li>${key} : ${statistics[key]}</li>`
        }
    }
    statsEl.innerHTML = info;
}

function initDeck() {
    gameState.deck.length = 0;
    const suits =  ["♠", "♥", "♣", "♦"];
    const ranks = ["A", 2,3,4,5,6,7,8,9,10,"J", "Q", "K"];
    for (const suit of suits) {
        for (const rank of ranks) {
            gameState.deck.push(new Card(rank, suit));
        }
    }

    shuffle(gameState.deck);

    gameState.cutCardIndex = 38 + Math.floor(Math.random() * 5);
}

// Fisher-Yates Shuffle Algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // pick index 0 to i
        [array[i], array[j]] = [array[j], array[i]];   // swap
    }
}