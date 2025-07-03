class Wordle {
    constructor() {
        //correct answer
        this.answer = "";
        this.row = 0;
        this.max = 6;
        //true when game ends
        this.done = false;

        //6 by 5 grid
        this.createBoard();
        //on-screen keyboard
        this.createKeyboard();
        //event handlers
        this.eventHandlers();
        //api call to get a random 5-letter word
        this.fetchWord();
    }

    //fallback 5-letter word list if API fails
    fallbackWords = [
        "APPLE", "GRAPE", "PLANT", "HOUSE", "TABLE",
        "CHAIR", "LIGHT", "WATER", "STONE", "CLOUD",
        "EARTH", "FIRED", "WINDS", "HEART", "BLUES",
        "GREEN", "PAUSE", "BLACK", "WHITE", "BROWN",
        "HAPPY", "HELLO", "BRAVE", "SMART", "HAPPY",
        "SADLY", "QUIET", "WATCH", "SWIFT", "FRESH"
    ];

    //api to get 5 letter word randomly
    fetchWord() {
        fetch("https://api.datamuse.com/words?sp=?????&max=1000")
            .then(res => res.json())
            .then(data => {
                // Filter only valid 5-letter words and randomly pick one
                const validWords = data
                    .map(entry => entry.word.toUpperCase())
                    .filter(word => /^[A-Z]{5}$/.test(word));

                if (validWords.length > 0) {
                    const word = validWords[Math.floor(Math.random() * validWords.length)];
                    this.answer = word;
                    console.log("Answer from Datamuse:", this.answer);
                } else {
                    this.FallbackWord("No valid word from Datamuse.");
                }
            })
            .catch(() => {
                this.FallbackWord("Failed to fetch from Datamuse.");
            });
    }


    
    //fallback word function to use a random word from the fallbackWords array
    FallbackWord(backup) {
        const rand = Math.floor(Math.random() * this.fallbackWords.length);
        this.answer = this.fallbackWords[rand].toUpperCase();
        console.log(backup, "Using fallback word:", this.answer);
    }

    //build 6 rows of 5 cells each
    createBoard() {
        const board = document.getElementById("game-board");
        for (let i = 0; i < this.max; i++) {
            const row = document.createElement("div");
            row.className = "row";
            for (let j = 0; j < 5; j++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                row.appendChild(cell);
            }
            board.appendChild(row);
        }
    }

    //build on-screen keyboard with letters A-Z
    createKeyboard() {
        const keyboard = document.getElementById("used-letters");

        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(letter => {
            const key = document.createElement("div");
            key.className = "letter-key";
            //set id for each key
            key.id = "key-" + letter;
            //set text content to the letter
            key.textContent = letter;

            //click event to add letter to input box
            key.addEventListener("click", () => {
                const inputBox = document.getElementById("guess-input");
                //5 letter limit
                if (inputBox.value.length < 5 && !this.done) {
                    inputBox.value += letter;
                }
            });

            keyboard.appendChild(key);
        });
    }

    //event handlers for guess submission, keyboard input, and restart
    eventHandlers() {
        document.getElementById("submit-btn")
            .addEventListener("click", () => this.handleGuess());

        document.getElementById("guess-input")
            .addEventListener("keypress", (e) => {
                if (e.key === "Enter") this.handleGuess();
            });

        document.getElementById("restart-btn")
            .addEventListener("click", () => location.reload());
    }

    //handle the guess submission
    //validate input, check guess, update board and keyboard, and handle win/loss cons
    handleGuess() {
        //if game is done or no answer, return
        if (this.done || !this.answer) return;

        //get the input box and the guess value
        const inputBox = document.getElementById("guess-input");
        //convert to uppercase for consistency
        const guess = inputBox.value.toUpperCase();

        //validate input
        if (!/^[A-Z]{5}$/.test(guess)) {
            this.showMsg("Please enter a valid 5-letter word", "orange");
            return;
        }

        //clear any previous messages
        this.showMsg("");

        //check each letter in the guess
        const status = this.checkGuess(guess);

        //update the probability of solving the word based on the guess
        this.updateProbability(guess, status);


        //update the board with correct, wrong-place, or not-in-word status
        const row = document.getElementsByClassName("row")[this.row];
        const cells = row.children;
        for (let i = 0; i < cells.length; i++) {
            cells[i].textContent = guess[i];
            cells[i].classList.add(status[i]);
        }


        //update color of each letter in the keyboard
        guess.split("").forEach((ltr, i) => {
            //update key status
            const key = document.getElementById("key-" + ltr);
            key.className = "letter-key " + status[i];
        });

        //WinCon
        if (guess === this.answer) {
            this.endGame(true);
            return;
        }

        //end if 6th guess
        this.row++;
        if (this.row === this.max) {
            this.endGame(false);
        }


        //clear for next guess
        inputBox.value = "";
    }

    //check the guess and return an array of status strings
    checkGuess(guess) {
        //default is "not-in-word" for each letter
        const result = Array(5).fill("not-in-word");
        //split the answer and guess into arrays
        const answerArr = this.answer.split("");
        const guessArr = guess.split("");

        //check for correct letter and position first
        for (let i = 0; i < 5; i++) {
            if (guessArr[i] === answerArr[i]) {
                result[i] = "correct";
                //remove matched letters from arrays to avoid double counting
                answerArr[i] = null;
                guessArr[i] = null;
            }
        }

        //check for correct letters in the wrong position
        for (let i = 0; i < 5; i++) {
            if (guessArr[i]) {
                for (let j = 0; j < 5; j++) {
                    if (answerArr[j] === guessArr[i]) {
                        result[i] = "wrong-place";
                        //mark the letter as used
                        answerArr[j] = null;
                        break;
                    }
                }
            }
        }

        //return the result array with status for each letter
        return result;
    }

    //message box
    showMsg(msg, color = "#000000") {
        const box = document.getElementById("message-box");
        box.textContent = msg;
        box.style.color = color;
    }

    //probability of solcving the word based on the guess
    updateProbability(guess, status) {
        //initial score
        let score = 0;

        for (let i = 0; i < status.length; i++) {
            if (status[i] === "correct") {
            //if the letter is correct and in the right place, add 2 points
            score += 2;
            } else if (status[i] === "wrong-place") {
            //if the letter is correct but in the wrong place, add 1 point
            score += 1;
            }
        }

        //max score of 10
        const chance = (score / 10) * 100;

        const box = document.getElementById("probability-box");
        box.textContent = `Estimated chance of solving next: ${chance.toFixed(0)}%`;
    }


    //game end
    endGame(won) {
        if (won) {
            this.showMsg(`You guessed it in ${this.row + 1} time(s)!`, "green");
            alert(`Congratulations! You guessed the word: ${this.answer}`);
        } else {
            this.showMsg(`Close but no cigar! Word was ${this.answer}`, "red");
            alert(`Game over! The word was: ${this.answer}`);
        }
        //show restart button
        document.getElementById("restart-btn").style.display = "inline-block";
        this.done = true;
    }
}

//start after DOM is loaded
window.addEventListener("DOMContentLoaded", () => new Wordle());