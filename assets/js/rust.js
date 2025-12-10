// ============================================
// INICIALIZAÇÃO DA PÁGINA DO RUST
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🦀 Inicializando página do Rust...");

  // Configurar highlight.js para blocos de código Rust
  if (typeof hljs !== "undefined") {
    hljs.highlightAll();

    // Registrar Rust como linguagem
    hljs.registerLanguage("rust", window.hljsDefineRust);
  }

  // Configurar tabs de código
  setupCodeTabs();

  // Adicionar animações de scroll
  addScrollAnimations();

  // Configurar interatividade
  setupInteractiveElements();

  console.log("✅ Página do Rust inicializada com sucesso!");
});

// ============================================
// TABS DE CÓDIGO
// ============================================

function setupSimpleCodeTabs() {
  const tabs = document.querySelectorAll(".code-tab");
  const examples = document.querySelectorAll(".code-example");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active de todas as tabs
      tabs.forEach((t) => t.classList.remove("active"));

      // Adiciona active na tab clicada
      this.classList.add("active");

      // Remove active de todos os exemplos
      examples.forEach((example) => example.classList.remove("active"));

      // Pega o ID do exemplo a ser mostrado
      const tabName = this.dataset.tab;
      const targetId = `${tabName}-code`;
      const targetExample = document.getElementById(targetId);

      // Mostra o exemplo correto
      if (targetExample) {
        targetExample.classList.add("active");
      }
    });
  });

  // Ativa a primeira tab por padrão
  if (tabs.length > 0 && !document.querySelector(".code-tab.active")) {
    tabs[0].click();
  }
}

// Use esta função em vez da anterior
document.addEventListener("DOMContentLoaded", function () {
  // ... outro código ...
  setupSimpleCodeTabs();
  // ... outro código ...
});

// ============================================
// ANIMAÇÕES DE SCROLL
// ============================================

function addScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in");

        // Animar elementos filhos com delay
        if (entry.target.classList.contains("pillar-card")) {
          const features = entry.target.querySelectorAll(".pillar-features li");
          features.forEach((feature, index) => {
            setTimeout(() => {
              feature.classList.add("animate-feature");
            }, index * 100);
          });
        }
      }
    });
  }, observerOptions);

  // Observar elementos para animação
  const elementsToAnimate = document.querySelectorAll(
    ".pillar-card, .timeline-item, .ecosystem-card, .reason-card, .stat-card, .resource-card, .diagram-step"
  );

  elementsToAnimate.forEach((element) => {
    observer.observe(element);
  });
}

// ============================================
// ELEMENTOS INTERATIVOS
// ============================================

function setupInteractiveElements() {
  // Cards com hover effects
  const cards = document.querySelectorAll(
    ".pillar-card, .ecosystem-card, .reason-card, .resource-card"
  );

  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transition = "all 0.3s ease";
    });
  });

  // Tooltips para recursos
  const resourceLinks = document.querySelectorAll(".resource-card");
  resourceLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (this.getAttribute("href") === "#") {
        e.preventDefault();
        showResourceModal(this.querySelector("h3").textContent);
      }
    });
  });

  // Efeito de digitação para exemplos de código
  const codeExamples = document.querySelectorAll(".code-example code");
  codeExamples.forEach((code, index) => {
    const originalText = code.textContent;
    code.textContent = "";

    // Animação de digitação (opcional, pode ser pesado)
    if (index === 0) {
      // Apenas no primeiro exemplo
      typeWriterEffect(code, originalText, 0);
    } else {
      code.textContent = originalText;
    }
  });
}

// ============================================
// EFEITOS VISUAIS
// ============================================

function typeWriterEffect(element, text, i) {
  if (i < text.length) {
    element.textContent += text.charAt(i);
    i++;
    setTimeout(() => typeWriterEffect(element, text, i), 20);
  }
}

function showResourceModal(title) {
  const modal = document.createElement("div");
  modal.className = "resource-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <p>Este é um link externo que abrirá em uma nova aba.</p>
        <p>Clique em "Continuar" para acessar o recurso ou "Cancelar" para fechar.</p>
      </div>
      <div class="modal-footer">
        <button class="modal-btn secondary" id="cancelModal">Cancelar</button>
        <button class="modal-btn primary" id="continueModal">Continuar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Configurar eventos do modal
  modal.querySelector(".close-modal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.querySelector("#cancelModal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.querySelector("#continueModal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Fechar ao clicar fora
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// ============================================
// ANIMAÇÕES CSS ADICIONAIS
// ============================================

// Adicionar estilos CSS dinâmicos
const rustStyles = `
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

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-in {
  animation: fadeInUp 0.6s ease-out forwards;
}

.pillar-card.animate-in {
  animation: slideInLeft 0.6s ease-out forwards;
}

.timeline-item.animate-in {
  animation: slideInRight 0.6s ease-out forwards;
}

.pillar-features li {
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.pillar-features li.animate-feature {
  opacity: 1;
  transform: translateX(0);
}

/* Estilos para o modal */
.resource-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.resource-modal .modal-content {
  background: #1a1a1a;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  border: 2px solid #3498db;
  overflow: hidden;
  animation: slideInUp 0.4s ease;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.resource-modal .modal-header {
  background: #2c3e50;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #3498db;
}

.resource-modal .modal-header h3 {
  color: white;
  margin: 0;
}

.resource-modal .close-modal {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resource-modal .modal-body {
  padding: 30px;
  color: #bdc3c7;
  line-height: 1.6;
}

.resource-modal .modal-footer {
  padding: 20px;
  background: #2c3e50;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.resource-modal .modal-btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.resource-modal .modal-btn.secondary {
  background: #7f8c8d;
  color: white;
}

.resource-modal .modal-btn.secondary:hover {
  background: #6c7b7d;
}

.resource-modal .modal-btn.primary {
  background: #3498db;
  color: white;
}

.resource-modal .modal-btn.primary:hover {
  background: #2980b9;
}

/* Melhorias para tabela responsiva */
@media (max-width: 768px) {
  .comparison-table {
    font-size: 0.9rem;
  }
  
  .feature-good,
  .feature-ok,
  .feature-bad {
    font-size: 0.8rem;
    padding: 3px 10px;
  }
}

/* Efeito de brilho para ícones */
.ecosystem-icon {
  position: relative;
  overflow: hidden;
}

.ecosystem-icon:after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: rotate(30deg);
  animation: shine 3s infinite linear;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(30deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(30deg);
  }
}

/* Scroll suave */
html {
  scroll-behavior: smooth;
}

/* Melhorias de acessibilidade */
.resource-card:focus,
.code-tab:focus,
.nav-link:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

/* Loading states */
.loading {
  opacity: 0.5;
  pointer-events: none;
}
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement("style");
styleSheet.textContent = rustStyles;
document.head.appendChild(styleSheet);
