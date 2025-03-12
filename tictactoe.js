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
                    if (sign != "") throw new Error("Square already assigned!"); // We can catch this in the gameboard or gameflow (haven't decided as of this comment)
                    sign = playerSign;
                }

                return { getSign, setSign };
            })();
        }
    }

    // A getter for the whole board
    const showBoardInConsole = () => {
        let shownBoard = board.map((row) => {
            let shownRow = row.map((square) => square.getSign());
            return shownRow;
        });
        console.log(shownBoard);
    };

    // Setter to be used by the gameplay. Might need a try-catch block here, haven't decided yet.
    const setSignForSquare = (row, column, sign) => {
        board[row][column].setSign(sign);
    };

    const getBoard = () => board;

    return { showBoardInConsole, setSignForSquare, getBoard }; // Probably a temporary thing
})();



const Gameflow = (function gameFlow() {
    // At some point I started to realize that the 2D array might be more trouble than it's worth, as it's hard to abstractly reference a cell
    // But, this is a workaround that lets me keep doing 2D... 1D might have been more efficient
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

    // Won't run the first turn; probably okay (could get around this by making this function part of the return but at this stage I'm not doing that)
    const startTurn = () => {
        Gameboard.showBoardInConsole();
        console.log(getActivePlayer().getName() + "'s turn")
    };

    // Plays a turn for the active player; try-catch ensures we won't switch players if the move is invalid
    const playTurn = (row, column) => {
        try {
            Gameboard.setSignForSquare(row, column, getActivePlayer().getSign());
            if (checkWin()) console.log(`Congratulations. ${getActivePlayer().getName()} is the winner!`);
            switchPlayer();
        } catch (error) {
            if (error.message === "Square already assigned!") console.log(error.message);
            else throw error;
        }
        startTurn();

    };
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

    return { playTurn };
})();