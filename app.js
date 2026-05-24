// Tic Tac Toe Game Implementation in JavaScript
let boxes = document.querySelectorAll(".box");
let resetBtn = document.querySelector("#reset");

// helper to set color based on mark
const updateBoxColor = (box) => {
    const mark = (box.innerText || "").trim();
    if (mark === "O") {
        box.style.color = "blue";
    } else if (mark === "X") {
        box.style.color = "red";
    } else {
        box.style.color = "";
    }
};

// observe changes to each box's text so color updates on click and resets
boxes.forEach((box) => {
    // set initial color (in case page restored state)
    updateBoxColor(box);

    const observer = new MutationObserver(() => updateBoxColor(box));
    observer.observe(box, { childList: true, characterData: true, subtree: true });
});
let newGameBtn = document.querySelector("#new");
let msgContainer = document.querySelector(".msg-container");
let msg = document.querySelector("#msg");
let turnO = true;
const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];
const resetGame = () => {
    turnO = true;
    // clear the board and enable boxes
    boxes.forEach((box) => {
        box.innerText = "";
        box.disabled = false;
    });
    // hide message
    if (msgContainer && msgContainer.classList) {
        msgContainer.classList.add("hide");
    }
    if (msg) {
        msg.innerText = "";
    }
}
boxes.forEach((box) => {
    box.addEventListener("click", () => {
        console.log('Box clicked');
        if (turnO) {
            box.innerText = "O";
            turnO = false;
        } else {
            box.innerText = "X";
            turnO = true;
        }
        box.disabled = true;
        checkWinner();
    });
});
const disableBoxes = () => {
    for (let box of boxes) {
        box.disabled = true;
    }
}
const showWinner = (winner ) => {
    if (msg) {
        msg.innerText = `${winner} has won the game!`;
    }
    // correctly remove the "hide" class if available
    if (msgContainer && msgContainer.classList) {
        msgContainer.classList.remove("hide");
    }
    disableBoxes();
}
const checkWinner = () => {
    for (let pattern of winPatterns) {
        let pos1Val = boxes[pattern[0]].innerText;
        let pos2Val = boxes[pattern[1]].innerText;
        let pos3Val = boxes[pattern[2]].innerText;
        if (pos1Val !== "" && pos2Val !== "" && pos3Val !== "") {
            if (pos1Val === pos2Val && pos2Val === pos3Val) {
                console.log("Winner", pos1Val);
                showWinner(pos1Val);
            }
        }
    }
}
if (resetBtn) {
    resetBtn.addEventListener("click", resetGame);
}
if (newGameBtn) {
    newGameBtn.addEventListener("click", resetGame);
}
// inject CSS for hover (light blue shadow) — avoids overriding .tilt transforms
const __hoverStyle = document.createElement("style");
__hoverStyle.textContent = `
.box { transition: box-shadow 140ms ease, transform 140ms ease; }
.box:not([disabled]):hover { box-shadow: 0 10px 30px rgba(6, 25, 44, 0.18); }
.box:focus { outline: none; }
`;
document.head.appendChild(__hoverStyle);
const __tiltStyle = document.createElement("style");
__tiltStyle.textContent = `
.box { transition: transform 140ms ease, box-shadow 140ms ease; }
.box.tilt { transform: rotate(-6deg) scale(0.98); box-shadow: 0 8px 20px rgba(0,0,0,0.18); }
`;
document.head.appendChild(__tiltStyle);
boxes.forEach((box) => {
    const addTilt = () => { if (!box.disabled) box.classList.add("tilt"); };
    const removeTilt = () => { box.classList.remove("tilt"); };

    box.addEventListener("mousedown", addTilt);
    box.addEventListener("touchstart", addTilt, { passive: true });

    box.addEventListener("mouseup", removeTilt);
    box.addEventListener("mouseleave", removeTilt);
    box.addEventListener("touchend", removeTilt);
    box.addEventListener("touchcancel", removeTilt);
    box.addEventListener("click", removeTilt);
});
// Simple AI opponent (plays X by default). Enable/disable via aiEnabled.
let aiEnabled = true;
const aiSymbol = "X";
const humanSymbol = aiSymbol === "X" ? "O" : "X";

const getBoard = () => Array.from(boxes).map(b => (b.innerText || "").trim());
const emptyIndices = (board) => board.reduce((acc, v, i) => { if (!v) acc.push(i); return acc; }, []);

const findWinningMove = (board, symbol) => {
    for (let pattern of winPatterns) {
        const vals = pattern.map(i => board[i]);
        const countSym = vals.filter(v => v === symbol).length;
        const countEmpty = vals.filter(v => !v).length;
        if (countSym === 2 && countEmpty === 1) {
            const emptyPos = pattern[vals.indexOf("")];
            return emptyPos;
        }
    }
    return -1;
};

const placeAt = (idx, symbol) => {
    const box = boxes[idx];
    if (!box || box.disabled || (box.innerText || "").trim()) return false;
    box.innerText = symbol;
    box.disabled = true;
    // flip turn
    turnO = symbol === "O" ? false : true;
    checkWinner();
    return true;
};

const aiMove = () => {
    if (!aiEnabled) return;
    // don't play if game over
    if (msgContainer && !msgContainer.classList.contains("hide")) return;

    const board = getBoard();

    // AI should play only on its turn
    const isAiTurn = (aiSymbol === "X" && !turnO) || (aiSymbol === "O" && turnO);
    if (!isAiTurn) return;

    // 1) Win if possible
    let idx = findWinningMove(board, aiSymbol);
    if (idx >= 0) { placeAt(idx, aiSymbol); return; }

    // 2) Block opponent winning move
    idx = findWinningMove(board, humanSymbol);
    if (idx >= 0) { placeAt(idx, aiSymbol); return; }

    // 3) Take center
    if (!board[4]) { placeAt(4, aiSymbol); return; }

    // 4) Take a corner if available
    const corners = [0, 2, 6, 8].filter(i => !board[i]);
    if (corners.length) {
        placeAt(corners[Math.floor(Math.random() * corners.length)], aiSymbol);
        return;
    }

    // 5) Fallback: take any empty
    const empties = emptyIndices(board);
    if (empties.length) {
        placeAt(empties[Math.floor(Math.random() * empties.length)], aiSymbol);
    }
};

// After any human click, schedule AI move (if AI plays second)
boxes.forEach((box) => {
    box.addEventListener("click", () => {
        // small delay to simulate thinking and ensure checkWinner ran for the human move
        setTimeout(() => {
            aiMove();
        }, 350);
    });
});

// If AI should play first (AI is O), start immediately on reset/new game
const maybeAiFirst = () => {
    if (!aiEnabled) return;
    if (aiSymbol === "O" && turnO) {
        // tiny delay so UI finishes resetting
        setTimeout(aiMove, 250);
    }
};
if (newGameBtn) newGameBtn.addEventListener("click", maybeAiFirst);
if (resetBtn) resetBtn.addEventListener("click", maybeAiFirst);

// Play on initial load if AI is first
maybeAiFirst();


    