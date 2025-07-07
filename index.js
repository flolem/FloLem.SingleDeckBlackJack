class Card {
    constructor(value, text) {
        this.value = value;
        this.text = text;
    }
}

const drawCardBtn = document.getElementById("drawCardBtn");
const stopPlayBtn = document.getElementById("stopPlayBtn");
const newGameBtn = document.getElementById("newGameBtn");
const sumEl = document.getElementById("sum-el");
const cardsEl = document.getElementById("cards-el");
const dealerCardsEl = document.getElementById("dealerCards-el");
const playerEl = document.getElementById("player-el");

newGameBtn.addEventListener('click', startGame);
drawCardBtn.addEventListener('click', drawCard);
stopPlayBtn.addEventListener('click', stopPlay);

const deck = [];
let playState = { playerHand: [], playerSum: 0, dealerHand: [], dealerSum: 0 };

function startGame() {
    initDeck();
    changePlayState(false);
    playerEl.textContent = "";

    // init current player hand
    playState.playerHand.length = 0;
    playState.playerHand.push(deck.pop());
    playState.playerHand.push(deck.pop());

    // dealer hand
    playState.dealerHand.length = 0;
    playState.dealerHand.push(deck.pop());
    playState.dealerHand.push(deck.pop());
    dealerCardsEl.textContent = playState.dealerHand[0].text + " #";

    renderPlayer();
    document.getElementById("gameArea").style.display = "block";
}

function drawCard() {
    console.log("draw card");
    if (drawCardBtn.disabled) {
        return;
    }

    playState.playerHand.push(deck.pop());
    renderPlayer();
}

function stopPlay() {
    changePlayState(true);
    console.log("stop play");
    setTimeout(dealerTurn, 1000);
}

function dealerTurn() {
    // display cards
    dealerCardsEl.classList.add("card-flash");
    renderCards(dealerCardsEl, playState.dealerHand);
    playState.dealerSum = calculateHandValue(playState.dealerHand);
    setTimeout(() => { dealerCardsEl.classList.remove("card-flash"); }, 1000);

    // check status
    if (playState.dealerSum >= 17) {
        finishRound();
        return;
    }

    setTimeout(() => {
        playState.dealerHand.push(deck.pop());
        dealerTurn(); 
    }, 1000);
}

function renderCards(domElement, cardsArray) {
    cardsText = "";
    for (const element of cardsArray) {
        cardsText += element.text + " "; 
    }

    domElement.textContent = cardsText;
}

function calculateHandValue(cardsArray) {
    let sum = 0;
    for (const element of cardsArray) {
        sum += element.value;
    }
    return sum;
}

function renderPlayer() {
    renderCards(cardsEl, playState.playerHand);
    playState.playerSum = calculateHandValue(playState.playerHand);
    sumEl.textContent = playState.playerSum;

    if (playState.playerSum >= 21) {
        stopGame();
    }
}

function stopGame() {
    var msg = playState.playerSum === 21 ? "Blackjack!" : "Bust!";
    playerEl.textContent = msg;
    changePlayState(true);
    if (playState.playerSum === 21) {
        setTimeout(dealerTurn(), 1000);
    }
}

function changePlayState(state) {
    drawCardBtn.disabled = state;
    stopPlayBtn.disabled = state;
}

function finishRound() {
    let msg = "";
    if (playState.dealerSum > 21) {
        msg = "Dealer busted ! You won this hand";
    }
    else if (playState.playerSum > playState.dealerSum) {
        msg = `You won with ${playState.playerSum} against dealer ${playState.dealerSum}`;
    } else if (playState.playerSum < playState.dealerSum) {
        msg = `You lost with ${playState.playerSum} against dealer ${playState.dealerSum}`;
    } else {
        msg = `DRAW ! Same cards values: ${playState.playerSum}`;
    }

    playerEl.textContent = msg;
}

function initDeck() {
    deck.length = 0;
    const suits =  ["♠", "♥", "♣", "♦"];
    const ranks = ["A", 2,3,4,5,6,7,8,9,10,"J", "Q", "K"];
    for (const suit of suits) {
        for (const rank of ranks) {
            let value = rank;
            if (rank === "J" || rank === "Q" || rank === "K") {
                value = 10;
            }
            if (rank === "A") {
                value = 11;
            }
            deck.push(new Card(value, rank+suit))
        }
    }

    shuffle(deck);
}

// Fisher-Yates Shuffle Algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // pick index 0 to i
        [array[i], array[j]] = [array[j], array[i]];   // swap
    }
}