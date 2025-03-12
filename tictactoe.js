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

    return { board }; // Probably a temporary thing
})();