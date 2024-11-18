
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
let paymentId = null;
let pixKey = '';

// Função para reiniciar o jogo
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

// Função para criar o tabuleiro
function createBoard() {
    board.innerHTML = '';
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.style.pointerEvents = 'none';
        cell.addEventListener('click', function () {
            if (attempts > 0) {
                attempts--;
                if (parseInt(cell.dataset.index) === prizeIndex) {
                    cell.classList.add('prize');
                    cell.innerHTML = '🏆';
                    winMessage.style.display = 'block';
                    setTimeout(() => window.location.href = 'https://app.acerto.club', 3000);
                    disableBoard();
                } else {
                    cell.classList.add('revealed');
                    cell.innerHTML = '❌';
                }
                if (attempts === 0) revealBoard();
            }
        });
        board.appendChild(cell);
    }
}

// Função para habilitar o tabuleiro
function enableBoard() {
    document.querySelectorAll('.cell').forEach(cell => cell.style.pointerEvents = 'auto');
    qrcodeImg.style.display = 'none';
    timerDisplay.style.display = 'none';
    gameLiberado.style.display = 'block';
}

// Função para desabilitar o tabuleiro
function disableBoard() {
    document.querySelectorAll('.cell').forEach(cell => cell.style.pointerEvents = 'none');
}

// Função para revelar o tabuleiro ao final
function revealBoard() {
    loseMessage.style.display = 'block';
    document.querySelectorAll('.cell').forEach((cell, index) => {
        cell.classList.add(index == prizeIndex ? 'prize' : 'revealed');
        cell.innerHTML = index == prizeIndex ? '🏆' : '❌';
    });
    disableBoard();
}

// Evento de clique do botão de Pix
pixButton.addEventListener('click', function () {
    const selectedCredit = parseInt(document.getElementById('credit-menu').value) || 3;
    fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'criarCobrancaPix', valor: selectedCredit }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.qr_code_base64) {
            qrcodeImg.src = `data:image/png;base64,${data.qr_code_base64}`;
            qrcodeImg.style.display = 'block';
            paymentId = data.payment_id;
            pixKey = data.pix_key;
            pixKeyDisplay.innerHTML = pixKey;
            pixKeyDisplay.style.display = 'block';
            startCountdown(60);
            pixButton.disabled = true;
            navigator.clipboard.writeText(pixKey).then(() => alert('Chave Pix copiada: ' + pixKey));
            credits = selectedCredit === 1 ? 3 : selectedCredit === 3 ? 4 : 5;
            attempts = credits;
            timerDisplay.innerHTML = `Você tem ${credits} tentativas!`;
            checkPaymentStatus(paymentId);
        } else {
            alert('Erro ao gerar cobrança Pix, tente novamente!');
            pixButton.disabled = false;
        }
    })
    .catch(error => {
        console.error('Erro ao gerar cobrança Pix:', error);
        alert('Erro ao gerar cobrança Pix, tente novamente!');
        pixButton.disabled = false;
    });
});

// Função para iniciar a contagem regressiva
function startCountdown(seconds) {
    let timeLeft = seconds;
    timerDisplay.innerHTML = `Aguarde ${timeLeft} segundos para concluir o pagamento...`;
    countdownInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerHTML = `Aguarde ${timeLeft} segundos para concluir o pagamento...`;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            timerDisplay.innerHTML = 'Tempo expirado. Por favor, gere um novo pagamento Pix.';
            resetGame();
        }
    }, 1000);
}

// Função para verificar o status do pagamento
function checkPaymentStatus(paymentId) {
    const intervalId = setInterval(() => {
        fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'verificarPagamento', paymentId: paymentId }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'Pagamento aprovado! Tentativas liberadas.') {
                clearInterval(intervalId);
                enableBoard();
                timerDisplay.innerHTML = `Você tem ${credits} tentativas!`;
            }
        });
    }, 5000);
}

// Inicializa o jogo
resetGame();
