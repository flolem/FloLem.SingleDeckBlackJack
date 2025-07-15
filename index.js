/* PLAN
MVP4: persistent deck / new hand button + minor stats : DONE
MVP5: Betting & money system : DONE
MVP6: advanced actions like Double or Split
MVP7: polish (use sessionStorage / localStorage, etc.)

sessionStorage.setItem("myState", JSON.stringify(gameState));
let restored = JSON.parse(sessionStorage.getItem("myState"));
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
    playerEl: document.getElementById("player-el"),
    deckInfoEl: document.getElementById("deckInfo"),
    moneyInfoEl: document.getElementById("moneyInfo"),
    statsEl: document.getElementById("statsAreaEl"),
    betBtn: document.getElementById("betBtn"),
    betErrorEl: document.getElementById("betError"),
    betForm: document.getElementById("betForm"),
    playArea: document.getElementById("playArea"),
    currentBetEl: document.getElementById("currentBetEl")
}

dom.newGameBtn.addEventListener('click', startGame);
dom.drawCardBtn.addEventListener('click', drawCard);
dom.stopPlayBtn.addEventListener('click', stopPlay);
dom.newPlayBtn.addEventListener('click', newPlay);
dom.betForm.addEventListener("submit", (e) => {
    e.preventDefault(); // prevent page reload
    confirmBet();
});

let playState = { 
    player: {
        cards: [],
        sum: 0
    },
    dealer: {
        cards: [],
        sum: 0
    },
    currentBet: 0
};
let dealerStarted = false;
let gameState = { deck: [], cutCardIndex: 0, money: 500 };

let statistics = {
    roundsPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    playerBlackjacks: 0,
    dealerBlackjacks: 0,
    bestWon: 0,
    worstLost: 0,
    lastFive: "-"
};

// ============ EVENT FUNCTIONS START HERE ===================
function startGame() {
    dealerStarted = false;
    initDeck();
    disableActionButtons(false);
    
    dom.betForm.hidden = false;
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

    playState.player.cards.length = 0;
    playState.dealer.cards.length = 0;

    dom.betForm.hidden = false;
    dom.playArea.hidden = true;
    dom.betBtn.disabled = false;
    dom.currentBetEl.textContent = "-";
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

function confirmBet() {
    const bet = Number(document.getElementById("betAmount").value);
    if (bet < 10 || bet > gameState.money || bet > 200 || bet % 2 != 0) {
        dom.betErrorEl.hidden = false;
        return;
    }

    playState.currentBet = bet;
    dom.betBtn.disabled = true;
    dom.betErrorEl.hidden = true;
    dom.currentBetEl.textContent = bet;
    gameState.money -= bet;
    dom.moneyInfoEl.textContent = gameState.money + "$";
    startNewPlay();
}

// ---------- INTERNAL FUNCTIONS ----------
function startNewPlay() { 
    dom.betForm.hidden = true;
    dom.playArea.hidden = false;
    playState.player.cards.push(drawFromDeck());
    playState.player.cards.push(drawFromDeck());
   
    playState.dealer.cards.push(drawFromDeck());
    playState.dealer.cards.push(drawFromDeck());
    playState.dealer.sum = calculateHandValue(playState.dealer.cards);
    dom.dealerCardsEl.textContent = playState.dealer.cards[0].text + "[?]";

    disableActionButtons(false);
    dealerStarted = false;
    renderPlayer();   
}

function isCutCardReached() {
    return gameState.deck.length <= 52 - gameState.cutCardIndex;
}

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

    if (isBlackjack(playState.dealer)) {
        disableActionButtons(true);
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
    let gameStatus = "W";
    let moneyChange = 0;

    if (isBlackjack(playState.player) && !isBlackjack(playState.dealer)) {
        moneyChange = playState.currentBet * 2.5;
        msg = `You won with your Blackjack !`;
    }
    else if (playState.player.sum > 21) {
        msg = "You bust !"
        gameStatus = "L";
    }
    else if (playState.dealer.sum > 21) {
        moneyChange = playState.currentBet * 2;
        msg = "Dealer busted ! You won this hand";
    }
    else if (playState.player.sum > playState.dealer.sum) {
        moneyChange = playState.currentBet * 2;
        msg = `You won with ${playState.player.sum} against dealer ${playState.dealer.sum}`;
    } else if (!isBlackjack(playState.player) && isBlackjack(playState.dealer)) {
        msg = "Dealer has blackjack. You lost.";
        gameStatus = "L";
    } else if (playState.player.sum < playState.dealer.sum) {
        msg = `You lost with ${playState.player.sum} against dealer ${playState.dealer.sum}`;
        gameStatus = "L";
    } else {
            moneyChange = playState.currentBet;
            msg = `DRAW ! Same cards values: ${playState.player.sum}`;
            gameStatus = "D";
        }

    
    gameState.money += moneyChange;
    compileStats(gameStatus, moneyChange - playState.currentBet);
    dom.playerEl.textContent = msg;
    dom.newPlayBtn.disabled = false;
    dom.newPlayBtn.removeAttribute("style");
}

function compileStats(gameStatus, moneyChange) {
    statistics.roundsPlayed++;
    switch (gameStatus) {
        case "W":
            statistics.wins++;
            break;
    
        case "L":
            statistics.losses++;
            break;
        
        case "D":
            statistics.draws++;
            break;
    }

    statistics.lastFive = (gameStatus + statistics.lastFive).slice(0, 5);
    if (isBlackjack(playState.player)) {
        statistics.playerBlackjacks++;
    }
    if (isBlackjack(playState.dealer)) {
        statistics.dealerBlackjacks++;
    }

    if (moneyChange > statistics.bestWon) 
        statistics.bestWon = moneyChange;
    if (moneyChange < statistics.worstLost)
        statistics.worstLost = moneyChange;

    let info = "";
    for (const [key, value] of Object.entries(statistics)) {
        info += `<li>${key} : ${value}</li>`;
    }
    dom.statsEl.innerHTML = info;

    dom.moneyInfoEl.textContent = gameState.money + "$";
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