/* ============================================================================
   Wordle Clone – Beginner Version with API Only
   ----------------------------------------------------------------------------
   • Gets a random 5-letter word from Datamuse API (no local backup)
   • Minimal and clearly commented for beginner understanding
============================================================================ */

class WordleGame {
  constructor() {
    this.answer = "";   // This will hold the correct word
    this.row = 0;       // Which guess we're on (max 6)
    this.max = 6;
    this.done = false;  // Set to true when the game ends

    this.makeBoard();       // Create the 6x5 tile grid
    this.makeKeyboard();    // Build the on-screen A-Z keyboard
    this.attachHandlers();  // Set up event listeners
    this.fetchWord();       // Get random word from API
  }

  // === Get a random 5-letter word from the Datamuse API ===
  fetchWord() {
    fetch("https://api.datamuse.com/words?sp=?????&max=1000")
      .then(response => response.json())
      .then(data => {
        const filtered = data.filter(w => /^[a-zA-Z]{5}$/.test(w.word));
        const word = filtered[Math.floor(Math.random() * filtered.length)]?.word?.toUpperCase();
        if (word) {
          this.answer = word;
          // show answer in console
          console.log("Answer:", this.answer); 
        } else {
          this.showMsg("Could not load a word. Please refresh.", "red");
        }
      })
      .catch(() => {
        this.showMsg("API error. Please refresh.", "red");
      });

  }

  // === Build the game board (6 rows of 5 tiles) ===
  makeBoard() {
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

  // === Build the on-screen A–Z keyboard ===
  makeKeyboard() {
    const keyboard = document.getElementById("used-letters");
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(letter => {
      const key = document.createElement("div");
      key.className = "letter-key";
      key.id = "key-" + letter;
      key.textContent = letter;
      keyboard.appendChild(key);
    });
  }

  // === Set up button clicks and keypress events ===
  attachHandlers() {
    document.getElementById("submit-btn")
            .addEventListener("click", () => this.handleGuess());

    document.getElementById("guess-input")
            .addEventListener("keypress", (e) => {
              if (e.key === "Enter") this.handleGuess();
            });

    document.getElementById("restart-btn")
            .addEventListener("click", () => location.reload());
  }

  // === Handle a user’s guess ===
  handleGuess() {
    if (this.done || !this.answer) return;

    const inputBox = document.getElementById("guess-input");
    const guess = inputBox.value.trim().toUpperCase();

    // Validate input
    if (!/^[A-Z]{5}$/.test(guess)) {
      this.showMsg("Please enter a valid 5-letter word", "orange");
      return;
    }

    this.showMsg(""); // Clear message

    // Check guess
    const status = this.checkGuess(guess);

    // Update board
    const row = document.getElementsByClassName("row")[this.row];
    [...row.children].forEach((cell, i) => {
      cell.textContent = guess[i];
      cell.classList.add(status[i]);
    });

    // Update keyboard
    guess.split("").forEach((ltr, i) => {
      const key = document.getElementById("key-" + ltr);
      key.className = "letter-key " + status[i];
    });

    // Win condition
    if (guess === this.answer) {
      this.endGame(true);
      return;
    }

    this.row++;
    if (this.row === this.max) {
      this.endGame(false);
    }

    inputBox.value = "";
  }

  // === Check the guess and return an array of status strings ===
  checkGuess(guess) {
    const result = Array(5).fill("not-in-word");
    const answerArr = this.answer.split("");
    const guessArr = guess.split("");

    // First pass: correct positions
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === answerArr[i]) {
        result[i] = "correct";
        answerArr[i] = null;
        guessArr[i] = null;
      }
    }

    // Second pass: wrong-place letters
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] && answerArr.includes(guessArr[i])) {
        result[i] = "wrong-place";
        answerArr[answerArr.indexOf(guessArr[i])] = null;
      }
    }

    return result;
  }

  // === Display a message above the board ===
  showMsg(msg, color = "#333") {
    const box = document.getElementById("message-box");
    box.textContent = msg;
    box.style.color = color;
  }

  // === Game over: win or lose ===
  endGame(won) {
    if (won) {
      this.showMsg(`🎉 You guessed it in ${this.row + 1} tries!`, "green");
    } else {
      this.showMsg(`😢 Out of guesses! Word was ${this.answer}`, "red");
    }
    document.getElementById("restart-btn").style.display = "inline-block";
    this.done = true;
  }
}

// === Start the game when the page loads ===
window.addEventListener("DOMContentLoaded", () => new WordleGame());
 