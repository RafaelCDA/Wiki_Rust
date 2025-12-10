// ============================================
// INICIALIZAÇÃO DA PÁGINA DO PROJETO
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Inicializando página do projeto...");

  // Configurar highlight.js se houver blocos de código
  if (typeof hljs !== "undefined") {
    hljs.highlightAll();
  }

  // Adicionar animações aos elementos
  addScrollAnimations();

  // Configurar interatividade dos cards
  setupInteractiveCards();

  console.log("✅ Página do projeto inicializada com sucesso!");
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
      }
    });
  }, observerOptions);

  // Observar elementos para animação
  const elementsToAnimate = document.querySelectorAll(
    ".workflow-step, .module-card, .algorithm-card, .spec-card, .use-case, .timeline-step"
  );

  elementsToAnimate.forEach((element) => {
    observer.observe(element);
  });
}

// ============================================
// CARDS INTERATIVOS
// ============================================

function setupInteractiveCards() {
  const cards = document.querySelectorAll(
    ".module-card, .algorithm-card, .spec-card, .use-case"
  );

  cards.forEach((card) => {
    // Efeito de hover com delay
    card.addEventListener("mouseenter", function () {
      this.style.transition = "all 0.3s ease";
    });

    // Clique para expandir (opcional)
    card.addEventListener("click", function () {
      this.classList.toggle("expanded");
    });
  });
}

// ============================================
// ANIMAÇÕES CSS ADICIONAIS
// ============================================

// Adicionar estilos CSS dinâmicos para animações
const projectStyles = `
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

.animate-in {
  animation: fadeInUp 0.6s ease-out forwards;
}

/* Estilo para cards expandidos */
.module-card.expanded,
.algorithm-card.expanded {
  transform: scale(1.02) translateY(-10px);
  z-index: 10;
  box-shadow: 0 20px 40px rgba(52, 152, 219, 0.3);
}

/* Efeito de destaque para seção ativa */
.format-diagram .diagram-section:hover {
  border-color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

/* Transições suaves */
.workflow-step,
.module-card,
.algorithm-card,
.spec-card,
.use-case,
.timeline-step {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s, transform 0.3s;
}

.animate-in {
  opacity: 1;
  transform: translateY(0);
}

/* Responsividade para diagrama */
@media (max-width: 768px) {
  .metadata-block {
    grid-template-columns: 1fr;
  }
  
  .file-block {
    font-size: 0.9rem;
  }
}

/* Melhorias para legibilidade */
code {
  font-family: 'Fira Code', 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  color: #e74c3c;
}

/* Scroll suave para links internos */
html {
  scroll-behavior: smooth;
}
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement("style");
styleSheet.textContent = projectStyles;
document.head.appendChild(styleSheet);
