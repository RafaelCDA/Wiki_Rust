// ============================================
// CONFIGURAÇÃO - EDITE AQUI
// ============================================

const CONFIG = {
  // 1. Vá no Canva → Sua apresentação → Compartilhar → Copiar link
  // 2. Cole o link completo abaixo
  CANVA_URL:
    "https://www.canva.com/design/DAG62M_X1xU/KQWRyAjNiGgm5PtEKUZ-fA/view",

  // 3. Se tiver PDF, coloque em: assets/media/slides.pdf
  // 4. Descomente a linha abaixo se tiver PDF
  // PDF_URL: "assets/media/slides.pdf",

  // 5. Nome do arquivo PDF ao baixar
  PDF_FILENAME: "Rust.pdf",
};

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🎯 Iniciando carregamento automático...");

  // Configurar botões
  setupButtons();

  // Carregar apresentação automaticamente
  loadCanvaPresentation();

  // Configurar PDF se existir
  setupPDFDownload();
});

// ============================================
// CARREGAR APRESENTAÇÃO DO CANVA
// ============================================

function loadCanvaPresentation() {
  const container = document.querySelector(".canva-container");
  const loading = document.getElementById("loading");

  // Verificar se o link está configurado
  if (!CONFIG.CANVA_URL || CONFIG.CANVA_URL.includes("SEU_ID_DO_CANVA")) {
    showError("Configure o link do Canva no arquivo slides.js");
    return;
  }

  // Criar URL de embed
  const embedUrl = CONFIG.CANVA_URL + "?embed";

  // Criar iframe
  const iframe = document.createElement("iframe");
  iframe.className = "canva-frame fade-in";
  iframe.src = embedUrl;
  iframe.frameBorder = "0";
  iframe.allowFullscreen = true;
  iframe.allow = "fullscreen";
  iframe.title = "Apresentação File Bundler";
  iframe.id = "canvaIframe";

  // Quando o iframe carregar, remover loading
  iframe.onload = function () {
    console.log("✅ Apresentação carregada com sucesso!");
    if (loading) {
      loading.style.display = "none";
    }

    // Atualizar link do botão Canva
    const canvaBtn = document.getElementById("canvaBtn");
    if (canvaBtn) {
      canvaBtn.href = CONFIG.CANVA_URL;
    }
  };

  // Em caso de erro
  iframe.onerror = function () {
    showError("Erro ao carregar a apresentação. Verifique o link do Canva.");
  };

  // Inserir iframe no container
  container.appendChild(iframe);

  // Esconder loading após 3 segundos (fallback)
  setTimeout(() => {
    if (loading && loading.style.display !== "none") {
      loading.style.display = "none";
    }
  }, 3000);
}

// ============================================
// CONFIGURAR BOTÕES
// ============================================

function setupButtons() {
  // Botão de tela cheia
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", toggleFullscreen);
  }

  // Botão do Canva
  const canvaBtn = document.getElementById("canvaBtn");
  if (canvaBtn) {
    canvaBtn.addEventListener("click", function (e) {
      if (!CONFIG.CANVA_URL || CONFIG.CANVA_URL.includes("SEU_ID_DO_CANVA")) {
        e.preventDefault();
        alert("Configure o link do Canva no arquivo slides.js");
      }
    });
  }
}

// ============================================
// DOWNLOAD DO PDF
// ============================================

function setupPDFDownload() {
  const downloadBtn = document.getElementById("downloadBtn");

  if (!downloadBtn) return;

  // Se não tiver PDF configurado, esconder botão
  if (!CONFIG.PDF_URL) {
    downloadBtn.style.display = "none";
    return;
  }

  // Verificar se o PDF existe
  checkFileExists(CONFIG.PDF_URL)
    .then((exists) => {
      if (exists) {
        // Configurar botão de download
        downloadBtn.href = CONFIG.PDF_URL;
        downloadBtn.download = CONFIG.PDF_FILENAME;
        downloadBtn.target = "_blank";

        console.log("✅ PDF configurado:", CONFIG.PDF_URL);
      } else {
        // PDF não encontrado
        console.warn("PDF não encontrado:", CONFIG.PDF_URL);
        downloadBtn.innerHTML =
          '<i class="fas fa-exclamation-circle"></i> PDF Indisponível';
        downloadBtn.style.opacity = "0.7";
        downloadBtn.style.cursor = "not-allowed";
        downloadBtn.onclick = function (e) {
          e.preventDefault();
          alert(
            `PDF não encontrado.\n\nColoque o arquivo em:\n${CONFIG.PDF_URL}`
          );
        };
      }
    })
    .catch((error) => {
      console.error("Erro ao verificar PDF:", error);
      downloadBtn.style.display = "none";
    });
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function toggleFullscreen() {
  const iframe = document.getElementById("canvaIframe");
  const container = document.querySelector(".canva-container");
  const element = iframe || container;

  if (!document.fullscreenElement) {
    // Entrar em tela cheia
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }

    // Atualizar botão
    const btn = document.getElementById("fullscreenBtn");
    if (btn) {
      btn.innerHTML = '<i class="fas fa-compress"></i> Sair da Tela Cheia';
    }
  } else {
    // Sair da tela cheia
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    // Atualizar botão
    const btn = document.getElementById("fullscreenBtn");
    if (btn) {
      btn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';
    }
  }
}

function checkFileExists(url) {
  return new Promise((resolve) => {
    // Para arquivos locais
    if (url.startsWith("assets/") || url.startsWith("./")) {
      fetch(url, { method: "HEAD" })
        .then((response) => resolve(response.ok))
        .catch(() => resolve(false));
    } else {
      // Para URLs externas
      resolve(true);
    }
  });
}

function showError(message) {
  const container = document.querySelector(".canva-container");
  const loading = document.getElementById("loading");

  if (loading) {
    loading.innerHTML = `
            <div class="status-message error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro de Configuração</h3>
                <p>${message}</p>
                <p style="margin-top: 15px; font-size: 0.9rem;">
                    Edite o arquivo <strong>slides.js</strong> e configure o link do Canva.
                </p>
            </div>
        `;
  } else if (container) {
    container.innerHTML = `
            <div class="status-message error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro de Configuração</h3>
                <p>${message}</p>
            </div>
        `;
  }

  console.error("❌ Erro:", message);
}

// ============================================
// DETECTAR MUDANÇAS NA TELA CHEIA
// ============================================

document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
document.addEventListener("msfullscreenchange", updateFullscreenButton);

function updateFullscreenButton() {
  const btn = document.getElementById("fullscreenBtn");
  if (!btn) return;

  if (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  ) {
    btn.innerHTML = '<i class="fas fa-compress"></i> Sair da Tela Cheia';
  } else {
    btn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';
  }
}

// ============================================
// NAVEGAÇÃO POR TECLADO (OPCIONAL)
// ============================================

document.addEventListener("keydown", function (e) {
  // Tecla F para tela cheia
  if (e.key === "f" || e.key === "F") {
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    toggleFullscreen();
  }

  // ESC para sair da tela cheia
  if (
    e.key === "Escape" &&
    (document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement)
  ) {
    toggleFullscreen();
  }
});
