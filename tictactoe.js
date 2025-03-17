/* Let's create a Gameboard object using an IIFE (we only need the one).
 * The board array is a 2D array containing all information about the tic-tac-toe board.
 * I opted to make each square represented by its own object. I'll explain why above the relevant line. */
const Gameboard = (function gameboard() {
    let board = [];
    const rows = 3;
    const columns = 3;

    // Now obviously the board is a square so the above lines may be somewhat unnecessary, but better to abstract a bit.
    // Choosing to have the first dimension of the array be rows and the second dimension be columns was purely an ad-hoc decision.
    // It does not really make a difference.
    for (let i = 0; i < rows; i++) {
        board[i] = [];
        for (let j = 0; j < columns; j++) {
            /* The gameboard could have easily held a 2D array of strings with the state.
             * But it's more effective for reach square to be represented by an object in itself, so that it could have methods on it.
             * Manipulation is thus much easier in this way, and more secure.
             * And while it does seem somewhat silly to invokve an IIFE inside a loop, ultimately we don't need more than 9 squares. */
            board[i][j] = (function boardSquare() {
                let sign = ""; // Obviously need to initialize as empty.

                // Getters and setters
                const getSign = () => sign;
                const setSign = (playerSign) => {
                    /* If sign is not empty, that means that square is already played to.
                     * If playerSign IS empty, that means this is a game reset, so this needs to go through also. */
                    if (sign != "" && playerSign != "") throw new Error("Square already assigned!");
                    sign = playerSign;
                }

                return { getSign, setSign };
            })();
        }
    }

    // Setter to be used by the gameplay. Might need a try-catch block here, haven't decided yet.
    const setSignForSquare = (row, column, sign) => {
        board[row][column].setSign(sign);
    };

    // Both the Game and Screen controllers need to be able to check game state
    const getBoard = () => board;

    // Essentially a helper function for resetting the game; otherthe Gameboard should only be written to by itself
    const resetBoard = function () {
        for (const row of board) {
            for (const square of row) {
                square.setSign('');
            }
        }
    }

    return { setSignForSquare, getBoard, resetBoard };
})();



const Gameflow = (function gameFlow() {
    // At some point I started to realize that the 2D array might be more trouble than it's worth, as it's hard to abstractly reference a cell
    // But, this is a workaround that lets me keep doing 2D... 1D might have been more efficient, as now I essentially need both, but
    // I still like representing the board itself as a 2D array. But maybe someday I'll clean it all up.
    const [topLeft, top, topRight, left, middle, right, bottomLeft, bottom, bottomRight] = (function () {
        let final = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                final.push({ row: i, column: j });
            }
        }
        return final;
    })();

    //Players only need to exist in the context of the gameflow
    function playerFactory(name, sign) {
        const getName = () => name;
        const getSign = () => sign;

        return { getName, getSign };
    }

    const playerOne = playerFactory("Player 1", "X");
    const playerTwo = playerFactory("Player 2", "O");

    // We need a way to track the active player, starting with playerOne
    let activePlayer = playerOne;
    const getActivePlayer = () => activePlayer;

    // The flow of turns
    const switchPlayer = () => {
        activePlayer = activePlayer === playerOne ? playerTwo : playerOne;
    }

    // Will be set to true when someone wins or the game is tied to prevent certain events
    // Will be set back to false if game is restarted
    let gameOver = false;

    // Just a shorthand for convenience
    const standardStatus = () => getActivePlayer().getName() + "'s turn";

    /* Game can only be won after at least 5 moves (by then the first player has gone 3 times).
     * Additionally, can only reach 9 moves total (9 squares), at which we know it's a tie if not a win */
    let turnsTaken = 0;

    // Puts everything into default states then "prompts" for gameplay
    function reset() {
        Gameboard.resetBoard();
        gameOver = false;
        turnsTaken = 0;
        activePlayer = playerOne;
        startTurn();
    }

    // Makes sure it's clear what turn it is, and if the previous turn attempt was invalid
    const startTurn = (unusualMessage = "") => {
        // Necessary to draw board here for the initial state and for a reset
        Screenflow.drawBoard();
        let gameStatus = unusualMessage === "" ? standardStatus() : unusualMessage + " " + standardStatus();
        Screenflow.updateStatus(gameStatus);
    };

    // Plays a turn for the active player; try-catch ensures we won't switch players if the move is invalid.
    // Unusual Message will ensure the player knows their move was bad.
    // The turn counter helps with short-circuiting the win-tracking and also helps checking ties.
    // Board is redrawn with every move; this may not be the most performant, but it does keep the game logic tighter
    const playTurn = (row, column) => {
        let unusualMessage;
        try {
            Gameboard.setSignForSquare(row, column, getActivePlayer().getSign());
            // I could call draw board here, but that would be redundant if the game's not over. So it's handled selectively.
            turnsTaken++;
            if (turnsTaken >= 5 && checkWin()) {
                Screenflow.drawBoard();
                Screenflow.updateStatus(`Congratulations. ${getActivePlayer().getName()} is the winner!`);
                gameOver = true;
            }
            else if (turnsTaken >= 9) {
                Screenflow.drawBoard();
                Screenflow.updateStatus("The game is tied!");
                gameOver = true;
            }
            if (!gameOver) switchPlayer();
        } catch (error) {
            if (error.message === "Square already assigned!") {
                unusualMessage = error.message;
            }
            else throw error;
        }
        if (!gameOver) startTurn(unusualMessage);
        else Screenflow.stopGame();

    };

    // Like I said above, it's a little ridiculous, but it does work.
    function checkWin() {
        const board = Gameboard.getBoard();
        const winConditions = [
            [topLeft, top, topRight],
            [left, middle, right],
            [bottomLeft, bottom, bottomRight],
            [topLeft, left, bottomLeft],
            [top, middle, bottom],
            [topRight, right, bottomRight],
            [topLeft, middle, bottomRight],
            [bottomLeft, middle, topRight]
        ];
        return winConditions.some((condition) => {
            let possibleWin = [];
            for (const square of condition) {
                if (board[square.row][square.column].getSign() === getActivePlayer().getSign())
                    possibleWin.push(square);
            }
            return possibleWin.length === 3;
        });
    }

    return { playTurn, reset };
})();

// This is purely about updating the screen.
const Screenflow = (function screenFlow() {
    // I think having a personal representation of the board is more efficient than constantly calling getBoard
    const board = Gameboard.getBoard();
    const boardDiv = document.querySelector(".board");
    const statusDiv = document.querySelector(".status");

    // Status area used for universal messages; Screenflow object has no control over types of messages, Gameflow determines
    const updateStatus = (statusMessage) => {
        statusDiv.textContent = statusMessage;
    }

    const clear = () => {
        const squares = boardDiv.querySelectorAll(".square");
        squares.forEach((square) => {
            boardDiv.removeChild(square);
        })
    }

    const drawBoard = () => {
        clear();
        for (let row = 0; row < 3; row++) {
            for (let column = 0; column < 3; column++) {
                let square = document.createElement("button");
                square.classList.add("square")
                square.setAttribute("type", "button");
                // Data attributes help bridge the gap between the visual board and the board object
                square.setAttribute("data-Row", `${row}`);
                square.setAttribute("data-Column", `${column}`);
                square.textContent = board[row][column].getSign();
                square.addEventListener('click', clickSquare);
                boardDiv.appendChild(square);
            }
        }
    }

    function clickSquare(e) {
        let row = parseInt(e.target.dataset.row);
        let column = parseInt(e.target.dataset.column);
        Gameflow.playTurn(row, column);
    }

    // When reaching an endgame condition, we must remove interactivity (except the square highlighting on hover set in the CSS, which I see no reason to remove)
    function stopGame() {
        const squares = boardDiv.querySelectorAll(".square");
        squares.forEach((square) => {
            square.removeEventListener('click', clickSquare);
        })
    }
    return { drawBoard, updateStatus, stopGame };
})();

Gameflow.reset();
