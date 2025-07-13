/* PLAN
MVP4: persistent deck / new hand button + minor stats : DONE
MVP5: Betting & money system
MVP6: advanced actions like Double or Split
MVP7: polish ?
*/
"use strict";

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

const dom = {
    drawCardBtn: document.getElementById("drawCardBtn"),
    stopPlayBtn: document.getElementById("stopPlayBtn"),
    newGameBtn: document.getElementById("newGameBtn"),
    newPlayBtn: document.getElementById("newPlayBtn"),
    sumEl: document.getElementById("sum-el"),
    cardsEl: document.getElementById("cards-el"),
    dealerCardsEl: document.getElementById("dealerCards-el"),
    playerEl:document.getElementById("player-el"),
    deckInfoEl: document.getElementById("deckInfo"),
    statsEl: document.getElementById("statsAreaEl")
}

dom.newGameBtn.addEventListener('click', startGame);
dom.drawCardBtn.addEventListener('click', drawCard);
dom.stopPlayBtn.addEventListener('click', stopPlay);
dom.newPlayBtn.addEventListener('click', newPlay);

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
    dom.newPlayBtn.disabled = true;
    if (isCutCardReached()) {
        initDeck();
        dom.playerEl.textContent = "Deck reshuffled";
    } else {
        dom.playerEl.textContent = "";
    }

    // init current player hand
    playState.player.cards.length = 0;
    playState.player.cards.push(drawFromDeck());
    playState.player.cards.push(drawFromDeck());

    // dealer hand
    playState.dealer.cards.length = 0;
    playState.dealer.cards.push(drawFromDeck());
    playState.dealer.cards.push(drawFromDeck());
    dom.dealerCardsEl.textContent = playState.dealer.cards[0].text + "[?]";

    disableActionButtons(false);
    dealerStarted = false;
    renderPlayer();   
}

function isCutCardReached() {
    return gameState.deck.length <= 52 - gameState.cutCardIndex;
}

function drawCard() {
    if (dom.drawCardBtn.disabled) {
        return;
    }

    playState.player.cards.push(drawFromDeck());
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
    dom.dealerCardsEl.classList.add("card-flash");
    renderCards(dom.dealerCardsEl, playState.dealer.cards);
    playState.dealer.sum = calculateHandValue(playState.dealer.cards);
    setTimeout(() => { dom.dealerCardsEl.classList.remove("card-flash"); }, 800);

    // check status
    if (playState.dealer.sum >= 17 || isBlackjack(playState.player)) {
        finishRound();
        return;
    }

    setTimeout(() => {
        playState.dealer.cards.push(drawFromDeck());
        dealerTurn(); 
    }, 800);
}

function renderCards(domElement, cardsArray) {
    dom.deckInfoEl.textContent = "🂠 " + gameState.deck.length;
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
    renderCards(dom.cardsEl, playState.player.cards);
    playState.player.sum = calculateHandValue(playState.player.cards);
    dom.sumEl.textContent = playState.player.sum;

    checkPlayerState() 
}

function checkPlayerState() {
    if (playState.player.sum > 21) {
        disableActionButtons(true);
        finishRound();
    }

    if (playState.player.sum === 21) {
        disableActionButtons(true);
        if (playState.player.cards.length === 2) {
            dom.playerEl.textContent = "You have a Blackjack !";
            setTimeout(() => {
                renderCards(dom.dealerCardsEl, playState.dealer.cards);
                playState.dealer.sum = calculateHandValue(playState.dealer.cards);
                finishRound();
            }, 1000);
            return;
        }

        setTimeout(dealerTurn, 1000);  
    }
}

function disableActionButtons(state) {
    dom.drawCardBtn.disabled = state;
    dom.stopPlayBtn.disabled = state;
}

function isBlackjack(hand) {
    return hand.cards.length === 2 && hand.sum === 21;
}

function finishRound() {
    let msg = "";
    let gameWinner = "player";

    if (isBlackjack(playState.player) && !isBlackjack(playState.dealer)) {
        msg = `You won with your Blackjack !`;
    }
    else if (playState.player.sum > 21) {
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
    } else if (!isBlackjack(playState.player) && isBlackjack(playState.dealer)) {
            msg = "Dealer has blackjack. You lose.";
            gameWinner = "dealer";
    }else {
            msg = `DRAW ! Same cards values: ${playState.player.sum}`;
            gameWinner = "draw";
        }

    compileStats(gameWinner);
    dom.playerEl.textContent = msg;
    dom.newPlayBtn.disabled = false;
    dom.newPlayBtn.removeAttribute("style");
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
    for (const [key, value] of Object.entries(statistics)) {
        info += `<li>${key} : ${value}</li>`;
    }
    dom.statsEl.innerHTML = info;
}

function drawFromDeck() {
    if (gameState.deck.length === 0) initDeck();
    return gameState.deck.pop();
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