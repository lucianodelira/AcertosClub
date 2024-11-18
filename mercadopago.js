
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbzl0mh7oon9Iu5NLBNGzhQ6SKoXPpSvqD4cyU7t6xi2fxdHUjVpAr_iL2bcEnkNUcZjUg/exec';
        const board = document.getElementById('game-board');
        const pixButton = document.getElementById('pix-button');
        const timerDisplay = document.getElementById('timer');
        const qrcodeImg = document.getElementById('qrcode');
        const pixKeyDisplay = document.getElementById('pix-key');
        const winMessage = document.getElementById('win-message');
        const loseMessage = document.getElementById('lose-message');
        const gameLiberado = document.getElementById('game-liberado');
        const totalCells = 12;
        let prizeIndex;
        let attempts;
        let credits;
        let countdownInterval;

        function resetGame() {
            prizeIndex = Math.floor(Math.random() * totalCells);
            attempts = 0;
            credits = 0;
            pixButton.disabled = false;
            timerDisplay.innerHTML = '';
            qrcodeImg.style.display = 'none';
            pixKeyDisplay.style.display = 'none';
            winMessage.style.display = 'none';
            loseMessage.style.display = 'none';
            gameLiberado.style.display = 'none';
            clearInterval(countdownInterval);
            createBoard();
        }

        function createBoard() {
            board.innerHTML = '';
            for (let i = 0; i < totalCells; i++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.index = i;

                cell.addEventListener('click', function () {
                    if (attempts > 0) {
                        attempts--;
                        if (parseInt(cell.dataset.index) === prizeIndex) {
                            cell.classList.add('prize');
                            cell.innerHTML = '🏆';
                            winMessage.style.display = 'block';
                            setTimeout(() => {
                                window.location.href = 'https://app.acerto.club';
                            }, 3000);
                            disableBoard();
                        } else {
                            cell.classList.add('revealed');
                            cell.innerHTML = '❌';
                        }
                        if (attempts === 0) {
                            revealBoard();
                        }
                    }
                });

                board.appendChild(cell);
            }
        }

        function enableBoard() {
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => cell.style.pointerEvents = 'auto');
            qrcodeImg.style.display = 'none';
            timerDisplay.style.display = 'none';
            gameLiberado.style.display = 'block';
        }

        function disableBoard() {
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => cell.style.pointerEvents = 'none');
        }

        function revealBoard() {
            loseMessage.style.display = 'block';
            const cells = document.querySelectorAll('.cell');
            cells.forEach((cell, index) => {
                if (index == prizeIndex) {
                    cell.classList.add('prize');
                    cell.innerHTML = '🏆';
                } else {
                    cell.classList.add('revealed');
                    cell.innerHTML = '❌';
                }
            });
            disableBoard();
        }

        pixButton.addEventListener('click', function () {
            const selectedCredit = 3; // Exemplo de crédito fixo
            credits = selectedCredit;
            attempts = credits;
            timerDisplay.innerHTML = `Você tem ${credits} tentativas!`;
            enableBoard();
        });

        resetGame();
