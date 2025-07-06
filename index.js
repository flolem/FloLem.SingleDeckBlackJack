class Card {
    constructor(value, text) {
        this.value = value;
        this.text = text;
    }
}

const drawCardBtn = document.getElementById("drawCardBtn");
const sumEl = document.getElementById("sum-el");
const cardsEl = document.getElementById("cards-el");
const playerEl = document.getElementById("player-el");

document.getElementById("newGameBtn").addEventListener('click', startGame);
drawCardBtn.addEventListener('click', drawCard);

const deck = [];
let myCurrentHand = [];

function startGame() {
    console.log("start Game");
    initDeck();
    drawCardBtn.disabled = false;
    playerEl.textContent = "";
    myCurrentHand = [];
    myCurrentHand.push(deck.pop());
    myCurrentHand.push(deck.pop());
    renderGame();
    document.getElementById("gameArea").style.display = "block";
}

function drawCard() {
    console.log("draw card");
    if (drawCardBtn.disabled) {
        return;
    }

    myCurrentHand.push(deck.pop());
    renderGame();
}

function renderGame() {
    let sum = 0;
    cardsEl.textContent = "";
    for (const element of myCurrentHand) {
        sum += element.value;
        cardsEl.textContent += element.text + " "; 
    }
    sumEl.textContent = sum;

    if (sum >= 21) {
        stopGame(sum);
    }
}

function stopGame(sum) {
    var msg = sum == 21 ? "Blackjack!" : "Bust!";
    playerEl.textContent = msg;
    drawCardBtn.disabled = true;
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