// ============================================
// INICIALIZAÇÃO DA PÁGINA HOME
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🏠 Inicializando página Home...");

  // Configurar highlight.js
  if (typeof hljs !== "undefined") {
    hljs.highlightAll();
  }

  // Configurar demonstração interativa
  setupDemo();

  // Configurar animações
  setupAnimations();

  // Configurar controles
  setupControls();

  console.log("✅ Página Home inicializada com sucesso!");
});

// ============================================
// DEMONSTRAÇÃO INTERATIVA
// ============================================

function setupDemo() {
  const startButton = document.getElementById("startDemo");
  const runButton = document.getElementById("runDemo");
  const copyButton = document.getElementById("copyDemo");
  const algorithmSelect = document.getElementById("algorithm");
  const fileCountSlider = document.getElementById("fileCount");
  const totalSizeSlider = document.getElementById("totalSize");
  const fileCountValue = document.getElementById("fileCountValue");
  const totalSizeValue = document.getElementById("totalSizeValue");
  const terminalOutput = document.getElementById("terminalOutput");
  const commandText = document.getElementById("commandText");

  if (!startButton) return;

  // Atualizar valores dos sliders
  fileCountSlider.addEventListener("input", function () {
    fileCountValue.textContent = `${this.value} arquivos`;
    updateCommand();
  });

  totalSizeSlider.addEventListener("input", function () {
    totalSizeValue.textContent = `${this.value} MB`;
    updateCommand();
  });

  algorithmSelect.addEventListener("change", updateCommand);

  function updateCommand() {
    const algorithm = algorithmSelect.value;
    const fileCount = fileCountSlider.value;
    const totalSize = totalSizeSlider.value;

    let compressFlag = "";
    if (algorithm === "lz4") {
      compressFlag = "--compress lz4";
    } else if (algorithm === "zstd") {
      compressFlag = "--compress zstd";
    }

    commandText.textContent = `file_bundler bundle --input ./projeto --output pacote.bundle ${compressFlag}`;
  }

  // Iniciar demonstração
  startButton.addEventListener("click", function () {
    startDemo();
  });

  // Executar demo
  runButton.addEventListener("click", function () {
    startDemo();
  });

  // Copiar comando
  copyButton.addEventListener("click", function () {
    const command = commandText.textContent;
    navigator.clipboard.writeText(command).then(() => {
      showNotification("Comando copiado para a área de transferência!");
    });
  });

  function startDemo() {
    const algorithm = algorithmSelect.value;
    const fileCount = fileCountSlider.value;
    const totalSize = totalSizeSlider.value;

    // Reset terminal
    terminalOutput.innerHTML = "";

    // Mostrar comando
    addTerminalLine(`$ ${commandText.textContent}`);

    // Simular processamento
    setTimeout(() => {
      addTerminalOutput(`<p>📦 Empacotando ${fileCount} arquivos...</p>`);
    }, 500);

    setTimeout(() => {
      let algorithmText = "";
      if (algorithm === "lz4") {
        algorithmText = "LZ4 (rápido)";
      } else if (algorithm === "zstd") {
        algorithmText = "ZStandard (balanceado)";
      } else {
        algorithmText = "nenhum";
      }
      addTerminalOutput(`<p>🗜️  Comprimindo com ${algorithmText}...</p>`);
    }, 1500);

    setTimeout(() => {
      // Calcular tamanho final baseado no algoritmo
      let finalSize = totalSize;
      if (algorithm === "lz4") {
        finalSize = Math.round(totalSize * 0.6);
      } else if (algorithm === "zstd") {
        finalSize = Math.round(totalSize * 0.5);
      }

      const compressionRatio = (totalSize / finalSize).toFixed(1);
      addTerminalOutput(
        `<p>✅ Bundle criado: pacote.bundle (${finalSize} MB)</p>`
      );
      addTerminalOutput(`<p>📊 Taxa de compressão: ${compressionRatio}:1</p>`);

      // Mostrar próximo comando
      setTimeout(() => {
        addTerminalLine(
          `$ file_bundler extract --input pacote.bundle --output ./extraido`
        );

        setTimeout(() => {
          addTerminalOutput(`<p>📂 Extraindo ${fileCount} arquivos...</p>`);

          setTimeout(() => {
            addTerminalOutput(`<p>✅ Extração concluída com sucesso!</p>`);
            showNotification("Demonstração concluída!");
          }, 1000);
        }, 500);
      }, 1000);
    }, 3000);
  }

  function addTerminalLine(text) {
    const line = document.createElement("div");
    line.className = "terminal-line";
    line.innerHTML = `<span class="prompt">$</span> ${text}`;
    terminalOutput.appendChild(line);
    scrollTerminalToBottom();
  }

  function addTerminalOutput(html) {
    const output = document.createElement("div");
    output.className = "terminal-output";
    output.innerHTML = html;
    terminalOutput.appendChild(output);
    scrollTerminalToBottom();
  }

  function scrollTerminalToBottom() {
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  // Inicializar comando
  updateCommand();
}

// ============================================
// ANIMAÇÕES
// ============================================

function setupAnimations() {
  // Observador de interseção para animações
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  // Observar elementos
  const elementsToAnimate = document.querySelectorAll(
    ".feature-card, .stat-card, .use-case-card, .module-card"
  );

  elementsToAnimate.forEach((element) => {
    observer.observe(element);
  });

  // Animar gráfico de barras
  const chartBars = document.querySelectorAll(".chart-bar");
  chartBars.forEach((bar) => {
    const height = bar.style.height;
    bar.style.height = "0%";

    setTimeout(() => {
      bar.style.transition = "height 1.5s ease";
      bar.style.height = height;
    }, 500);
  });
}

// ============================================
// CONTROLES
// ============================================

function setupControls() {
  // Scroll suave para links internos
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Efeito de digitação no hero (opcional)
  const heroTitle = document.querySelector(".hero-highlight");
  if (heroTitle) {
    const originalText = heroTitle.textContent;
    heroTitle.textContent = "";

    let i = 0;
    function typeWriter() {
      if (i < originalText.length) {
        heroTitle.textContent += originalText.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      }
    }

    // Iniciar após um pequeno delay
    setTimeout(typeWriter, 500);
  }
}

// ============================================
// NOTIFICAÇÕES
// ============================================

function showNotification(message) {
  // Remover notificação anterior se existir
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Criar nova notificação
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  // Mostrar notificação
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Remover após 3 segundos
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

// ============================================
// ESTILOS DINÂMICOS PARA NOTIFICAÇÕES
// ============================================

const dynamicStyles = `
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #2ecc71;
  color: white;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.notification.show {
  opacity: 1;
  transform: translateY(0);
  animation: slideInUp 0.3s ease;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification i {
  font-size: 1.2rem;
}

/* Animações para elementos */
.animate-in {
  animation: fadeInUp 0.6s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Efeito de brilho para cards */
.feature-card:hover .feature-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Scroll suave */
html {
  scroll-behavior: smooth;
}
`;

// Adicionar estilos dinâmicos
const styleSheet = document.createElement("style");
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);
