document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const MODAL_ID = 'paymentModal'; // Prefixo exclusivo
  const MODAL_CONTENT_ID = 'modalContent'; // Prefixo exclusivo
  const MODAL_INNER_ID = 'modalInnerContent'; // Prefixo exclusivo
  
  // Adiciona uma classe exclusiva ao body para evitar sobrecarga
  body.classList.add('modal-body');
  
  // Define o HTML do modal com IDs exclusivos
  const modalHTML = `
    <div id="${MODAL_ID}">
      <div id="${MODAL_CONTENT_ID}">
        <div id="${MODAL_INNER_ID}">
          <p id="status">Gerando pagamento, aguarde...</p>
          <div id="loadingSpinner"></div>
          <img id="qrCode" alt="QR Code do PIX" width="200" height="200" style="display: none;">
          <div id="pixKeySection" style="display: none;">
            <h2>Chave PIX</h2><br><br>Valor da transação: R$ 18,00<br><br>Após o pagamento, o sistema de palpites será desbloqueado.<br><br>
            <div id="pixKey" contenteditable="true"></div>
            <button id="copyButton">Copiar Chave PIX</button>
          </div>
          <p id="statusMessage"></p>
          <button class="closeModal">Fechar</button>
        </div>
      </div>
    </div>
    <div id="copyNotification">Chave PIX copiada!</div>
  `;
  
  // Não substituir todo o conteúdo do body; apenas adicionar o modal ao final.
  body.insertAdjacentHTML('beforeend', modalHTML);

  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPXlgv795gYZZIXU8oi56a-yd4iQZ_5BGGYpQP_LK9jJFfBEY83uZ8qluXEDJncBjtKA/exec';
  const PAYMENT_STORAGE_KEY = 'pixPayment';
  const EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutos em milissegundos

  let paymentId;

  window.openPaymentModal = function() {
    const savedPayment = getSavedPayment();
    if (savedPayment && Date.now() - savedPayment.timestamp < EXPIRATION_TIME) {
      loadSavedPayment(savedPayment);
      checkPaymentStatus(savedPayment.paymentId); // Verifica o status do pagamento salvo
    } else {
      openModal();
      createPayment();
    }
  };

  function openModal() {
    document.getElementById(MODAL_ID).style.display = 'flex';
    bindModalEvents();
  }

  function closeModal() {
    document.getElementById(MODAL_ID).style.display = 'none';
    resetModalContent();
  }

  function resetModalContent() {
    const modalInnerContent = document.getElementById(MODAL_INNER_ID);
    modalInnerContent.innerHTML = `
      <p id="status">Gerando pagamento, aguarde...</p>
      <div id="loadingSpinner"></div>
      <img id="qrCode" alt="QR Code do PIX" width="200" height="200" style="display: none;">
      <div id="pixKeySection" style="display: none;">
        <h2>Chave PIX</h2><br><br>Valor da transação: R$ 18,00<br><br>Após o pagamento, o sistema de palpites será desbloqueado.<br><br>
        <div id="pixKey" contenteditable="true"></div>
        <button id="copyButton">Copiar Chave PIX</button>
      </div>
      <p id="statusMessage"></p>
      <button class="closeModal">Fechar</button>
    `;
    bindModalEvents();
  }

  function bindModalEvents() {
    const closeModalButton = document.querySelector('.closeModal');
    if (closeModalButton) {
      closeModalButton.onclick = closeModal;
    }

    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
      copyButton.onclick = copyToClipboard;
    }
  }

  function getSavedPayment() {
    const paymentData = localStorage.getItem(PAYMENT_STORAGE_KEY);
    return paymentData ? JSON.parse(paymentData) : null;
  }

  function savePayment(data) {
    const paymentData = {
      paymentId: data.paymentId,
      qrCodeBase64: data.qrCodeBase64,
      qrCodePix: data.qrCodePix,
      timestamp: Date.now(),
    };
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(paymentData));
  }

  function loadSavedPayment(data) {
    const qrCodeImage = document.getElementById('qrCode');
    const pixKey = document.getElementById('pixKey');
    const pixKeySection = document.getElementById('pixKeySection');

    qrCodeImage.src = `data:image/png;base64,${data.qrCodeBase64}`;
    qrCodeImage.style.display = 'block';
    pixKey.textContent = data.qrCodePix;
    pixKeySection.style.display = 'block';

    openModal();
    document.getElementById('status').textContent = 'Pagamento pendente!';
  }

  async function createPayment() {
    const statusElement = document.getElementById('status');
    const spinner = document.getElementById('loadingSpinner');

    spinner.style.display = 'block';
    statusElement.textContent = 'Gerando pagamento, aguarde...';

    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=createPayment`, {
        method: 'GET',
      });
      const data = await response.json();

      if (data.success) {
        savePayment(data);
        const qrCodeImage = document.getElementById('qrCode');
        const pixKey = document.getElementById('pixKey');
        const pixKeySection = document.getElementById('pixKeySection');

        qrCodeImage.src = `data:image/png;base64,${data.qrCodeBase64}`;
        qrCodeImage.style.display = 'block';
        pixKey.textContent = data.qrCodePix;
        pixKeySection.style.display = 'block';
        spinner.style.display = 'none';
        statusElement.textContent = 'Pagamento gerado com sucesso!';
        paymentId = data.paymentId; // Salva o ID do pagamento.

        checkPaymentStatus(paymentId); // Inicia a verificação do pagamento.
      } else {
        spinner.style.display = 'none';
        statusElement.textContent = `Erro: ${data.message}`;
      }
    } catch (error) {
      spinner.style.display = 'none';
      statusElement.textContent = `Erro na conexão: ${error.message}`;
    }
  }

  async function checkPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getPaymentStatus&paymentId=${paymentId}`, {
        method: 'GET',
      });
      const data = await response.json();

      if (data.success) {
        if (data.status === 'approved') {
          showSuccessMessage();
          localStorage.setItem('privilegeAccess', 'true'); // DESBLOQUEIA OS PALPITES
          localStorage.removeItem(PAYMENT_STORAGE_KEY); // Remove o pagamento armazenado
        } else if (data.status === 'pending') {
          setTimeout(() => checkPaymentStatus(paymentId), 5000); // Verifica novamente após 5 segundos.
        } else {
          document.getElementById('statusMessage').textContent = `Status do pagamento: ${data.statusDetail}`;
        }
      } else {
        document.getElementById('statusMessage').textContent = `Erro: ${data.message}`;
      }
    } catch (error) {
      document.getElementById('statusMessage').textContent = `Erro na conexão: ${error.message}`;
    }
  }

  function showSuccessMessage() {
    const modalContent = document.getElementById(MODAL_INNER_ID);
    modalContent.innerHTML = `
      <img id="successIcon" src="MPayment/BuyOK.png" alt="Pagamento realizado com sucesso">
      <h2>Pagamento realizado com sucesso!</h2>
      <a class="closeModal">Fechar</a>
    `;
    bindModalEvents();
  }

  function copyToClipboard() {
    const pixKey = document.getElementById('pixKey').textContent;
    navigator.clipboard.writeText(pixKey).then(() => {
      const notification = document.getElementById('copyNotification');
      notification.style.display = 'block';
      setTimeout(() => {
        notification.style.display = 'none';
      }, 2000); // A mensagem dura 2 segundos.
    });
  }
});
