// Memory Game Component
AFRAME.registerComponent("memory-game", {
    init: function () {
        this.cards = [];
        this.flippedCards = [];
        this.pairsFound = 0;
        this.totalPairs = 8;
        this.canFlip = true;

        // Imagens para usar como valores das cartas (usando os assets fornecidos)
        this.cardImages = [
            "Assets/ALCHEMY white.png",
            "Assets/ALCHEMY white.png",
            "Assets/DEVOLUTION white.png",
            "Assets/DEVOLUTION white.png",
            "Assets/DREAMCATCHER white.png",
            "Assets/DREAMCATCHER white.png",
            "Assets/EARTHRISE white.png",
            "Assets/EARTHRISE white.png",
            "Assets/ICARUS white.png",
            "Assets/ICARUS white.png",
            "Assets/INFECTED white.png",
            "Assets/INFECTED white.png",
            "Assets/OTHERWORLDLY white.png",
            "Assets/OTHERWORLDLY white.png",
            "Assets/TEE white.png",
            "Assets/TEE white.png",
        ];

        // Emparelhar imagens
        this.cardPairs = [];
        for (let i = 0; i < this.cardImages.length; i++) {
            this.cardPairs.push({
                image: this.cardImages[i],
            });
        }

        // Shuffle the card values
        this.shuffle(this.cardPairs);

        // Add event listener to scene to ensure raycaster is working
        this.el.sceneEl.addEventListener("loaded", () => {
            console.log("Scene loaded, setting up game interactions");
            // Create the game board after the scene is fully loaded
            this.createBoard();
        });

        // Add click listener for restart button
        const restartButton = document.getElementById("restart-button");
        restartButton.addEventListener("click", () => this.resetGame());
    },

    shuffle: function (array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    createBoard: function () {
        const gameBoard = document.getElementById("game-board");

        // Clear any existing cards
        while (gameBoard.firstChild) {
            gameBoard.removeChild(gameBoard.firstChild);
        }

        // Card dimensions and spacing
        const cardWidth = 0.4;
        const cardHeight = 0.4;
        const gap = 0.1;
        const cols = 4;
        const rows = 4;

        // Calculate board dimensions
        const boardWidth = cols * cardWidth + (cols - 1) * gap;
        const boardHeight = rows * cardHeight + (rows - 1) * gap;

        // Calculate starting position (top-left of board)
        const startX = -boardWidth / 2 + cardWidth / 2;
        const startY = boardHeight / 2 - cardHeight / 2;

        // Create cards
        let cardIndex = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (cardWidth + gap);
                const y = startY - row * (cardHeight + gap);

                const cardPair = this.cardPairs[cardIndex];

                // Create card entity
                const card = document.createElement("a-entity");
                card.setAttribute("position", `${x} ${y} 0`);
                card.setAttribute("data-index", cardIndex);
                card.setAttribute("data-image", cardPair.image);
                card.setAttribute("class", "card");

                // Create card front (face-down) - Esta é a parte clicável
                const cardFront = document.createElement("a-plane");
                cardFront.setAttribute("width", cardWidth);
                cardFront.setAttribute("height", cardHeight);
                cardFront.setAttribute("color", "#1E90FF");
                cardFront.setAttribute("position", "0 0 0.01");
                cardFront.setAttribute("class", "card-front clickable");

                // Adicionando componente de hover em vez de animation
                cardFront.setAttribute("card-hover", "");

                // Adiciona um símbolo de ? na frente
                const questionMark = document.createElement("a-text");
                questionMark.setAttribute("value", "?");
                questionMark.setAttribute("color", "white");
                questionMark.setAttribute("position", "0 0 0.02");
                questionMark.setAttribute("align", "center");
                questionMark.setAttribute("width", 2);
                questionMark.setAttribute("scale", "0.5 0.5 0.5");
                cardFront.appendChild(questionMark);

                // Adicionar evento de clique diretamente ao cardFront
                cardFront.addEventListener("click", () => {
                    this.flipCard(card);
                });

                // Substituir o verso da carta por imagem
                const imagePlane = document.createElement("a-plane");
                imagePlane.setAttribute(
                    "width",
                    cardWidth * 0.9
                );
                imagePlane.setAttribute(
                    "height",
                    cardHeight * 0.9
                );
                imagePlane.setAttribute(
                    "material",
                    `src: ${cardPair.image}; shader: flat`
                );
                imagePlane.setAttribute("visible", "false");
                imagePlane.setAttribute("position", "0 0 0.1");
                imagePlane.setAttribute("class", "card-image");

                // Create card background (for the back/revealed side)
                const cardBackBg = document.createElement("a-plane");
                cardBackBg.setAttribute("width", cardWidth);
                cardBackBg.setAttribute("height", cardHeight);
                cardBackBg.setAttribute("color", "#FFFFFF");
                cardBackBg.setAttribute("position", "0 0 0");
                cardBackBg.setAttribute("visible", "false");
                cardBackBg.setAttribute("class", "card-back-bg");

                // Add all parts to the card
                card.appendChild(cardFront);
                card.appendChild(cardBackBg);
                card.appendChild(imagePlane);

                // Add to game board
                gameBoard.appendChild(card);

                // Store reference to the card
                this.cards.push(card);

                cardIndex++;
            }
        }

        console.log(`Criado tabuleiro com ${this.cards.length} cartas`);
    },

    flipCard: function (card) {
        console.log("Tentando virar carta");
        // Get card components
        const cardFront = card.querySelector(".card-front");
        const cardBackBg = card.querySelector(".card-back-bg");
        const imagePlane = card.querySelector(".card-image");

        // Check if card can be flipped
        if (
            !this.canFlip ||
            this.flippedCards.includes(card) ||
            (imagePlane && imagePlane.getAttribute("visible") === true)
        ) {
            return;
        }

        console.log("Virando carta");
        // Flip the card
        cardFront.setAttribute("visible", false);
        cardFront.classList.remove("clickable"); // Remover clickable quando virada
        cardBackBg.setAttribute("visible", true);
        if (imagePlane) imagePlane.setAttribute("visible", true);

        // Add to flipped cards
        this.flippedCards.push(card);

        // Check for match if we have 2 cards flipped
        if (this.flippedCards.length === 2) {
            this.canFlip = false;
            setTimeout(() => this.checkMatch(), 1000);
        }
    },

    checkMatch: function () {
        const card1 = this.flippedCards[0];
        const card2 = this.flippedCards[1];

        const image1 = card1.getAttribute("data-image");
        const image2 = card2.getAttribute("data-image");

        if (image1 === image2) {
            // Match found
            this.pairsFound++;

            // Update score
            document.getElementById(
                "score"
            ).textContent = `Pares Encontrados: ${this.pairsFound}`;

            // Display message
            const messageEl = document.getElementById("message");
            messageEl.textContent = "Par encontrado!";
            setTimeout(() => {
                messageEl.textContent = "";
            }, 1500);

            // Remove cards from game logic (keep visible)
            this.flippedCards = [];

            // Check if game is complete
            if (this.pairsFound === this.totalPairs) {
                this.gameComplete();
            }
        } else {
            // No match
            // Flip cards back
            this.flippedCards.forEach((card) => {
                const cardFront = card.querySelector(".card-front");
                const cardBackBg = card.querySelector(".card-back-bg");
                const imagePlane = card.querySelector(".card-image");

                cardFront.setAttribute("visible", true);
                cardFront.classList.add("clickable"); // Restaurar clickable
                cardBackBg.setAttribute("visible", false);
                if (imagePlane) imagePlane.setAttribute("visible", false);
            });

            // Display message
            const messageEl = document.getElementById("message");
            messageEl.textContent = "Não é um par!";
            setTimeout(() => {
                messageEl.textContent = "";
            }, 1500);

            // Reset flipped cards
            this.flippedCards = [];
        }

        // Allow flipping again
        this.canFlip = true;
    },

    gameComplete: function () {
        // Show victory message
        const victoryMessage = document.getElementById("victory-message");
        victoryMessage.setAttribute("visible", true);
        victoryMessage.setAttribute("text", "opacity", 1);

        // Show restart button
        const restartButton = document.getElementById("restart-button");
        restartButton.setAttribute("visible", true);

        // Display message
        const messageEl = document.getElementById("message");
    messageEl.textContent = "Parabéns! Você encontrou todos os pares!";
    },

    resetGame: function () {
        // Reset game variables
        this.flippedCards = [];
        this.pairsFound = 0;

        // Reset score
        document.getElementById("score").textContent = "Pairs Found: 0";

        // Clear message
        document.getElementById("message").textContent = "";

        // Hide victory elements
        document
            .getElementById("victory-message")
            .setAttribute("visible", false);
        document
            .getElementById("restart-button")
            .setAttribute("visible", false);

        // Shuffle cards and recreate board
        this.shuffle(this.cardPairs);
        this.createBoard();
    },
});

// Componente auxiliar para melhorar o cursor
AFRAME.registerComponent("cursor-feedback", {
    init: function () {
        var el = this.el;

        el.addEventListener("mouseenter", function () {
            el.setAttribute("material", "color", "#4CAF50");
        });

        el.addEventListener("mouseleave", function () {
            el.setAttribute("material", "color", "white");
        });

        el.addEventListener("click", function () {
            console.log("Cursor click detectado");
        });
    },
});

// Novo componente para o hover das cartas que não usa animation
AFRAME.registerComponent("card-hover", {
    init: function () {
        const el = this.el;
        const originalColor = "#1E90FF";
        const hoverColor = "#64B5F6";

        el.addEventListener("mouseenter", () => {
            el.setAttribute("material", "color", hoverColor);
        });

        el.addEventListener("mouseleave", () => {
            el.setAttribute("material", "color", originalColor);
        });
    },
});
