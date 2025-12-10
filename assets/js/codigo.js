// ============================================
// CONFIGURAÇÃO DOS CÓDIGOS
// ============================================

const CODE_CONFIG = {
  // Links para repositório
  GITHUB_URL:
    "https://github.com/bruno-hsj/gerenciador-cli/blob/gerenciador-cli-v2/src/archive.rs",
  DOWNLOAD_URL:
    "https://github.com/seu-usuario/file-bundler/archive/refs/heads/main.zip",

  // Comandos atualizados
  COMMANDS: {
    build: "cargo build",
    run: "cargo run",
    bundle: "cargo run -- bundle --input teste_data --output meu_pacote.bundle",
    extract:
      "cargo run -- extract --input teste_data.bundle --output ./meu_diretorio",
    lz4_compress:
      "cargo run -- bundle -i teste_data -o pacote_lz4.bundle -c lz4",
    lz4_decompress: "cargo run -- extract -i pacote_lz4.bundle -o saida_lz4",
    zstd_compress:
      "cargo run -- bundle -i teste_data -o pacote_zstd.bundle -c zstd",
    zstd_decompress: "cargo run -- extract -i pacote_zstd.bundle -o saida_zstd",
  },

  // Códigos SEM comentários
  CODE_EXAMPLES: {
    archive: `use serde::{Serialize, Deserialize};

pub const ARCHIVE_VERSION: u32 = 2;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
pub enum CompressionMethod {
    None,
    Lz4,
    Zstd,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FileEntry {
    pub path: String,
    pub size: u64,
    pub original_size: u64,
    pub offset: u64,
    pub is_directory: bool,
    pub compression_method: CompressionMethod,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ArchiveManifest {
    pub entries: Vec<FileEntry>,
    pub version: u32,
}`,

    bundle: `use crate::archive::{ArchiveManifest, CompressionMethod, FileEntry, ARCHIVE_VERSION};
use crate::{BundleArgs, CompressionAlgorithm};
use std::fs::File;
use std::io::{self, BufWriter, Seek, Write};
use walkdir::WalkDir;

pub fn run_bundle(args: &BundleArgs) -> io::Result<()> {
    let file = File::create(&args.output)?;
    let mut writer = BufWriter::new(file);
    let mut manifest_entries = Vec::<FileEntry>::new();

    let compression_method = match args.compress {
        Some(CompressionAlgorithm::Lz4) => CompressionMethod::Lz4,
        Some(CompressionAlgorithm::Zstd) => CompressionMethod::Zstd,
        None => CompressionMethod::None,
    };

    for input_path in &args.input {
        for entry in WalkDir::new(input_path).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            let metadata = entry.metadata()?;
            let path_str = path.to_str()?.to_string();
            let offset = writer.stream_position()?;
            let is_directory = metadata.is_dir();
            let mut stored_size = 0;
            let mut original_size = 0;

            if metadata.is_file() {
                original_size = metadata.len();
                let mut input_file = File::open(path)?;

                match compression_method {
                    CompressionMethod::None => {
                        stored_size = io::copy(&mut input_file, &mut writer)?;
                    }
                    CompressionMethod::Lz4 => {
                        let mut encoder = lz4::EncoderBuilder::new()
                            .level(4)
                            .build(&mut writer)?;
                        io::copy(&mut input_file, &mut encoder)?;
                        let (_output, result) = encoder.finish();
                        result?;
                    }
                    CompressionMethod::Zstd => {
                        zstd::stream::copy_encode(&mut input_file, &mut writer, 0)?;
                    }
                }

                let new_offset = writer.stream_position()?;
                stored_size = new_offset - offset;
            }

            manifest_entries.push(FileEntry {
                path: path_str,
                size: stored_size,
                original_size,
                offset,
                is_directory,
                compression_method,
            });
        }
    }

    let manifest = ArchiveManifest {
        entries: manifest_entries,
        version: ARCHIVE_VERSION,
    };

    let manifest_bytes = bincode::serialize(&manifest)?;
    let manifest_size = manifest_bytes.len() as u64;
    writer.write_all(&manifest_bytes)?;
    writer.write_all(&manifest_size.to_le_bytes())?;
    writer.flush()?;
    
    Ok(())
}`,

    extract: `use crate::archive::{ArchiveManifest, CompressionMethod, ARCHIVE_VERSION};
use crate::ExtractArgs;
use std::fs::{self, File};
use std::io::{self, BufReader, Read, Seek, SeekFrom};
use std::path::Path;

pub fn run_extract(args: &ExtractArgs, output_dir: &Path) -> io::Result<()> {
    let file = File::open(&args.input)?;
    let mut reader = BufReader::new(file);

    reader.seek(SeekFrom::End(-8))?;
    let mut size_bytes = [0u8; 8];
    reader.read_exact(&mut size_bytes)?;
    let manifest_size = u64::from_le_bytes(size_bytes);

    reader.seek(SeekFrom::End(-((manifest_size + 8) as i64)))?;
    let manifest_reader = reader.by_ref().take(manifest_size);
    
    let manifest: ArchiveManifest = bincode::deserialize_from(manifest_reader)?;

    if manifest.version != ARCHIVE_VERSION {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "Versão incompatível"));
    }

    fs::create_dir_all(output_dir)?;

    for entry in manifest.entries {
        let dest_path = output_dir.join(&entry.path);

        if entry.is_directory {
            fs::create_dir_all(&dest_path)?;
            continue;
        }

        if let Some(parent) = dest_path.parent() {
            fs::create_dir_all(parent)?;
        }

        reader.seek(SeekFrom::Start(entry.offset))?;
        let mut entry_reader = reader.by_ref().take(entry.size);
        let mut dest_file = File::create(&dest_path)?;

        match entry.compression_method {
            CompressionMethod::None => {
                io::copy(&mut entry_reader, &mut dest_file)?;
            }
            CompressionMethod::Lz4 => {
                let mut decoder = lz4::Decoder::new(entry_reader)?;
                io::copy(&mut decoder, &mut dest_file)?;
            }
            CompressionMethod::Zstd => {
                zstd::stream::copy_decode(&mut entry_reader, &mut dest_file)?;
            }
        }
    }

    Ok(())
}`,

    main: `use clap::{Parser, Subcommand, ValueEnum};
use std::path::{Path, PathBuf};

mod archive;
mod bundle;
mod extract;

#[derive(Parser, Debug)]
#[command(name = "file_bundler", version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    Bundle(BundleArgs),
    Extract(ExtractArgs),
}

#[derive(Parser, Debug)]
pub struct BundleArgs {
    #[arg(short, long, required = true, num_args = 1..)]
    input: Vec<PathBuf>,
    
    #[arg(short, long, required = true)]
    output: PathBuf,
    
    #[arg(short, long, value_enum)]
    compress: Option<CompressionAlgorithm>,
}

#[derive(Parser, Debug)]
pub struct ExtractArgs {
    #[arg(short, long, required = true)]
    input: PathBuf,
    
    #[arg(short, long)]
    output: Option<PathBuf>,
}

#[derive(ValueEnum, Clone, Debug, Copy)]
pub enum CompressionAlgorithm {
    Lz4,
    Zstd,
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Bundle(args) => {
            if let Err(e) = bundle::run_bundle(args) {
                eprintln!("Erro ao criar o bundle: {}", e);
            } else {
                println!("Bundle '{}' criado com sucesso!", args.output.display());
            }
        }
        Commands::Extract(args) => {
            let output_dir = args.output.as_deref().unwrap_or_else(|| Path::new("."));

            if let Err(e) = extract::run_extract(args, output_dir) {
                eprintln!("Erro ao extrair o bundle: {}", e);
            } else {
                println!("Extração concluída com sucesso!");
            }
        }
    }
}`,
  },
};

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log("Texto copiado:", text);
    })
    .catch((err) => {
      console.error("Erro ao copiar:", err);
      // Fallback para textarea
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    });
}

function showCopyFeedback(button, message) {
  const originalHTML = button.innerHTML;
  const originalText = button.querySelector("span")
    ? button.querySelector("span").textContent
    : "";

  button.innerHTML = `<i class="fas fa-check"></i> ${message}`;
  button.style.background = "#27ae60";

  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.style.background = "";
  }, 2000);
}

function removeComments(code) {
  // Remove comentários de linha (// ...)
  code = code.replace(/\/\/.*$/gm, "");

  // Remove comentários de bloco (/* ... */)
  code = code.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove linhas vazias extras
  code = code.replace(/^\s*[\r\n]/gm, "");

  return code.trim();
}

// ============================================
// CONFIGURAÇÃO DO VISUALIZADOR DE CÓDIGO (ABAS SUPERIORES)
// ============================================

function setupCodeTabs() {
  // CORREÇÃO: Seletor correto para as tabs do visualizador de código
  const tabButtons = document.querySelectorAll(".file-tabs .tab-btn");
  const codeContainers = document.querySelectorAll(
    ".viewer-content .code-container"
  );

  console.log("🔍 Encontradas tabs de código:", tabButtons.length);

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const file = this.dataset.file;
      console.log("📁 Clicou na tab:", file);

      // Remover active de todas as abas
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      codeContainers.forEach((container) =>
        container.classList.remove("active")
      );

      // Adicionar active na aba clicada
      this.classList.add("active");

      // Mostrar container correspondente
      const targetContainer = document.getElementById(`code-${file}`);
      if (targetContainer) {
        targetContainer.classList.add("active");
        console.log("✅ Mostrando container:", targetContainer.id);

        // Re-aplicar highlight no código
        setTimeout(() => {
          const codeElement = targetContainer.querySelector("code");
          if (codeElement) {
            hljs.highlightElement(codeElement);
          }
        }, 10);
      } else {
        console.error("❌ Container não encontrado:", `code-${file}`);
      }
    });
  });

  // Ativar primeira tab por padrão se não houver nenhuma ativa
  if (
    !document.querySelector(".file-tabs .tab-btn.active") &&
    tabButtons.length > 0
  ) {
    tabButtons[0].click();
  }
}

// ============================================
// CONFIGURAÇÃO DOS CONSTRUTORES (ABAS INFERIORES)
// ============================================

function setupConstructors() {
  // CORREÇÃO: Seletor correto para as tabs dos construtores
  const navTabs = document.querySelectorAll(".constructors-nav .nav-tab");
  const constructorModules = document.querySelectorAll(".constructor-module");

  console.log("🔍 Encontradas tabs de construtores:", navTabs.length);

  navTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const target = this.dataset.target;
      console.log("🏗️ Clicou no construtor:", target);

      // Remover active de todas as tabs e módulos
      navTabs.forEach((t) => t.classList.remove("active"));
      constructorModules.forEach((m) => m.classList.remove("active"));

      // Adicionar active na tab clicada
      this.classList.add("active");

      // Mostrar módulo correspondente
      const targetModule = document.getElementById(`module-${target}`);
      if (targetModule) {
        targetModule.classList.add("active");
        console.log("✅ Mostrando módulo:", targetModule.id);

        // Re-aplicar highlight no código
        setTimeout(() => {
          const codeElement = targetModule.querySelector("code");
          if (codeElement) {
            hljs.highlightElement(codeElement);
          }
        }, 10);
      } else {
        console.error("❌ Módulo não encontrado:", `module-${target}`);
      }
    });
  });

  // Ativar primeira tab por padrão se não houver nenhuma ativa
  if (
    !document.querySelector(".constructors-nav .nav-tab.active") &&
    navTabs.length > 0
  ) {
    navTabs[0].click();
  }

  // Botões de cópia para construtores
  const copyButtons = document.querySelectorAll(".constructor-code .copy-btn");
  copyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const target = this.dataset.copy;
      const code = CODE_CONFIG.CODE_EXAMPLES[target] || "";

      if (code) {
        copyToClipboard(code);
        showConstructorCopyFeedback(this);
      }
    });
  });
}

function showConstructorCopyFeedback(button) {
  const originalHTML = button.innerHTML;

  button.innerHTML = '<i class="fas fa-check"></i> Código Copiado!';
  button.style.background = "#27ae60";
  button.style.transform = "scale(1.05)";

  // Destacar o código brevemente
  const codeContainer = button.closest(".constructor-code");
  if (codeContainer) {
    codeContainer.style.boxShadow = "0 0 20px rgba(46, 204, 113, 0.3)";
    codeContainer.style.borderColor = "#2ecc71";

    setTimeout(() => {
      codeContainer.style.boxShadow = "";
      codeContainer.style.borderColor = "";
    }, 1000);
  }

  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.style.background = "";
    button.style.transform = "";
  }, 2000);
}

// ============================================
// CONFIGURAÇÃO DOS BOTÕES DE CÓPIA
// ============================================

function setupCopyButtons() {
  // Botões de cópia no visualizador de código
  const copyButtons = document.querySelectorAll(".viewer-content .copy-btn");

  copyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const target = this.dataset.target;
      const code = CODE_CONFIG.CODE_EXAMPLES[target] || "";

      if (code) {
        copyToClipboard(code);
        showCopyFeedback(this, "Código copiado!");
      }
    });
  });
}

function setupCommandCopy() {
  const commandButtons = document.querySelectorAll(".copy-cmd");

  commandButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const command = this.dataset.cmd;

      if (command) {
        copyToClipboard(command);
        showCopyFeedback(this, "Comando copiado!");
      }
    });
  });
}

// ============================================
// CONFIGURAÇÃO DOS LINKS DE AÇÃO
// ============================================

function setupActionLinks() {
  // GitHub
  const githubBtn = document.getElementById("githubBtn");
  if (githubBtn) {
    githubBtn.href = CODE_CONFIG.GITHUB_URL;
    githubBtn.addEventListener("click", function (e) {
      if (
        !CODE_CONFIG.GITHUB_URL ||
        CODE_CONFIG.GITHUB_URL.includes("seu-usuario")
      ) {
        e.preventDefault();
        alert("Configure o link do GitHub no arquivo codigo.js");
      }
    });
  }

  // Download
  const downloadBtn = document.getElementById("downloadCodeBtn");
  if (downloadBtn) {
    downloadBtn.href = CODE_CONFIG.DOWNLOAD_URL;
    downloadBtn.addEventListener("click", function (e) {
      if (
        !CODE_CONFIG.DOWNLOAD_URL ||
        CODE_CONFIG.DOWNLOAD_URL.includes("seu-usuario")
      ) {
        e.preventDefault();
        alert("Configure o link de download no arquivo codigo.js");
      }
    });
  }

  // Executar Online (simulação)
  const runBtn = document.getElementById("runBtn");
  if (runBtn) {
    runBtn.addEventListener("click", showRunSimulation);
  }
}

// ============================================
// SIMULAÇÃO DE EXECUÇÃO
// ============================================

function showRunSimulation() {
  const modal = document.createElement("div");
  modal.className = "run-modal";
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-terminal"></i> Terminal de Execução</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="terminal-output">
                    <div class="terminal-line">
                        <span class="prompt">$</span> cargo build --release
                    </div>
                    <div class="terminal-line output">
                        Compiling file-bundler v0.1.0
                    </div>
                    <div class="terminal-line output">
                        Finished release [optimized] target(s) in 2.45s
                    </div>
                    
                    <div class="terminal-line">
                        <span class="prompt">$</span> cargo run -- bundle --input teste_bundle --output arquivo.bundle
                    </div>
                    <div class="terminal-line output">
                        📦 Empacotando 15 arquivos...
                    </div>
                    <div class="terminal-line output success">
                        ✅ Bundle criado: arquivo.bundle (45.2 MB)
                    </div>
                    
                    <div class="terminal-line">
                        <span class="prompt">$</span> cargo run -- bundle -i teste_data -o pacote_lz4.bundle -c lz4
                    </div>
                    <div class="terminal-line output">
                        🗜️  Comprimindo com LZ4...
                    </div>
                    <div class="terminal-line output success">
                        ✅ Compressão concluída: 45.2 MB → 21.8 MB (2.07:1)
                    </div>
                    
                    <div class="terminal-line blink">
                        <span class="prompt">$</span> █
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn" id="closeRunModal">Fechar</button>
                <button class="modal-btn primary" id="tryCommand">Tentar Comando</button>
                <button class="modal-btn primary" id="copyOutput">Copiar Output</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  // Configurar eventos do modal
  modal.querySelector(".close-modal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.querySelector("#closeRunModal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.querySelector("#copyOutput").addEventListener("click", () => {
    const output = modal.querySelector(".terminal-output").textContent;
    copyToClipboard(output);

    const btn = modal.querySelector("#copyOutput");
    btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    btn.style.background = "#27ae60";

    setTimeout(() => {
      btn.innerHTML = "Copiar Output";
      btn.style.background = "";
    }, 2000);
  });

  // Fechar ao clicar fora
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// ============================================
// CARREGAR SNIPPETS (OPCIONAL)
// ============================================

async function loadCodeSnippets() {
  try {
    const files = ["archive", "bundle", "extract", "main"];

    for (const file of files) {
      const response = await fetch(`assets/snippets/${file}.rs`);
      if (response.ok) {
        const code = await response.text();
        // Remove comentários do código
        const cleanCode = removeComments(code);
        CODE_CONFIG.CODE_EXAMPLES[file] = cleanCode;

        // Atualiza o display nos construtores
        const constructorCode = document.querySelector(`#module-${file} code`);
        if (
          constructorCode &&
          document.querySelector(`#module-${file}`).classList.contains("active")
        ) {
          constructorCode.textContent = cleanCode;
          hljs.highlightElement(constructorCode);
        }

        // Atualiza o display no visualizador
        const viewerCode = document.querySelector(`#code-${file} code`);
        if (
          viewerCode &&
          document.querySelector(`#code-${file}`).classList.contains("active")
        ) {
          viewerCode.textContent = cleanCode;
          hljs.highlightElement(viewerCode);
        }
      }
    }
  } catch (error) {
    console.warn("Não foi possível carregar snippets:", error);
  }
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("💻 Inicializando página de código...");

  // Configurar highlight.js
  hljs.highlightAll();

  // Configurar abas do visualizador de código
  setupCodeTabs();

  // Configurar abas dos construtores
  setupConstructors();

  // Configurar botões de cópia
  setupCopyButtons();
  setupCommandCopy();

  // Configurar links de ação
  setupActionLinks();

  // Carregar snippets se existirem
  loadCodeSnippets();

  console.log("✅ Página de código inicializada com sucesso!");
});

// ============================================
// ESTILOS PARA MODAL (mantenha no final do arquivo)
// ============================================

const modalStyles = `
.run-modal {
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

.run-modal .modal-content {
    background: #1a1a1a;
    border-radius: 16px;
    width: 90%;
    max-width: 800px;
    border: 2px solid #3498db;
    overflow: hidden;
    animation: slideUp 0.4s ease;
}

.run-modal .modal-header {
    background: #2c3e50;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #3498db;
}

.run-modal .modal-header h3 {
    color: white;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.run-modal .close-modal {
    background: transparent;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.run-modal .modal-body {
    padding: 20px;
}

.run-modal .terminal-output {
    background: #000;
    border-radius: 8px;
    padding: 20px;
    font-family: 'Fira Code', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #00ff00;
    min-height: 300px;
    overflow-y: auto;
}

.run-modal .terminal-line {
    margin-bottom: 8px;
    white-space: pre-wrap;
}

.run-modal .prompt {
    color: #3498db;
    margin-right: 10px;
    font-weight: bold;
}

.run-modal .output {
    color: #bdc3c7;
    padding-left: 20px;
}

.run-modal .success {
    color: #2ecc71;
    font-weight: bold;
}

.run-modal .blink {
    animation: blink 1s infinite;
}

.run-modal .modal-footer {
    padding: 20px;
    background: #2c3e50;
    display: flex;
    justify-content: flex-end;
    gap: 15px;
}

.run-modal .modal-btn {
    background: #7f8c8d;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
}

.run-modal .modal-btn:hover {
    background: #6c7b7d;
    transform: translateY(-2px);
}

.run-modal .modal-btn.primary {
    background: #3498db;
}

.run-modal .modal-btn.primary:hover {
    background: #2980b9;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}
`;

// Adicionar estilos do modal ao documento
const styleSheet = document.createElement("style");
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);
async function loadNoCommentsCode() {
  try {
    const files = {
      main: "main-no-comments.rs",
      bundle: "bundle-no-comments.rs",
      extract: "extract-no-comments.rs",
      archive: "archive-no-comments.rs",
      cargo: "cargo-toml.txt",
    };

    for (const [key, filename] of Object.entries(files)) {
      try {
        const response = await fetch(`assets/snippets/${filename}`);
        if (response.ok) {
          const code = await response.text();
          CODE_CONFIG.CODE_NO_COMMENTS[key] = code;

          // Atualiza o visualizador se esta aba estiver ativa
          const viewerCode = document.querySelector(`#code-${key} code`);
          if (
            viewerCode &&
            document.querySelector(`#code-${key}`).classList.contains("active")
          ) {
            viewerCode.textContent = code;
            hljs.highlightElement(viewerCode);
          }
        }
      } catch (error) {
        console.warn(`Não foi possível carregar ${filename}:`, error);
      }
    }
  } catch (error) {
    console.warn("Erro ao carregar códigos sem comentários:", error);
  }
}
