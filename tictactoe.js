/* To start, we need to think about how we'll represent individual squares on the board.
 * The Gameboard object (coming later) could easily just hold a 2D array of strings that hold the state.
 * However, I think it's more effective if each square is represented by an object in itself.
 * This boardSquare object can hold a string, but can also have methods on it.
 * This would make manipulation and state changes both easier and more secure. */
function boardSquare() {
    let sign = ""; // Obviously need to initialize as empty.

    // Getters and setters
    const getSign = () => sign;
    const setSign = (playerSign) => {
        if (sign != "") throw new Error("Square already assigned!"); // We can catch this in the gameboard or gameflow (haven't decided as of this comment)
        sign = playerSign;
    }

    return { getSign, setSign };
}

// For this initial example, let's just have a single sample square and test that the methods work.
const sampleSquare = boardSquare();