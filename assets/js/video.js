// ============================================
// CONFIGURAÇÃO DO VÍDEO - EDITE AQUI
// ============================================

const VIDEO_CONFIG = {
  // 1. Coloque seu vídeo em: assets/media/video.mp4
  // 2. Ou use um link externo (YouTube, Vimeo, etc.)
  VIDEO_SOURCE: "assets/media/apresentacao.mp4",

  // 3. Thumbnail/Poster (imagem de capa)
  POSTER_IMAGE: "assets/images/video-thumbnail.jpg",

  // 4. Link para download (se tiver)
  DOWNLOAD_URL: "assets/media/apresentacao.mp4",

  // 5. Nome do arquivo ao baixar
  DOWNLOAD_FILENAME: "apresentacao.mp4",

  // 6. Informações do vídeo (opcional)
  VIDEO_INFO: {
    duration: "00:00", // Será atualizado automaticamente
    resolution: "1080p",
    format: "MP4",
    size: "150 MB", // Opcional
  },
};

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let videoPlayer = null;
let isPlaying = false;
let currentPlaybackRate = 1;
let isMuted = false;
let lastVolume = 100;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🎬 Inicializando player de vídeo...");

  // Carregar vídeo automaticamente
  loadVideo();

  // Configurar controles
  setupVideoControls();

  // Configurar botões de ação
  setupActionButtons();
});

// ============================================
// CARREGAR VÍDEO
// ============================================

function loadVideo() {
  const videoContainer = document.getElementById("videoPlayer");
  const loadingElement = document.getElementById("videoLoading");

  if (!videoContainer) {
    console.error("Container de vídeo não encontrado");
    return;
  }

  // Criar elemento de vídeo
  videoPlayer = document.createElement("video");
  videoPlayer.id = "mainVideo";
  videoPlayer.className = "fade-in";
  videoPlayer.poster = VIDEO_CONFIG.POSTER_IMAGE;
  videoPlayer.preload = "metadata";

  // Criar source
  const source = document.createElement("source");
  source.src = VIDEO_CONFIG.VIDEO_SOURCE;
  source.type = "video/mp4";

  videoPlayer.appendChild(source);

  // Mensagem de fallback
  videoPlayer.innerHTML += `
        Seu navegador não suporta a tag de vídeo.
        <a href="${VIDEO_CONFIG.VIDEO_SOURCE}" target="_blank">Clique aqui para baixar o vídeo</a>
    `;

  // Adicionar vídeo ao container
  videoContainer.appendChild(videoPlayer);

  // Configurar eventos do vídeo
  setupVideoEvents();

  // Verificar se o vídeo existe
  checkVideoExists(VIDEO_CONFIG.VIDEO_SOURCE)
    .then((exists) => {
      if (exists) {
        console.log("✅ Vídeo encontrado:", VIDEO_CONFIG.VIDEO_SOURCE);

        // Esconder loading após o vídeo carregar
        videoPlayer.addEventListener("loadeddata", function () {
          if (loadingElement) {
            loadingElement.style.display = "none";
          }
          updateVideoInfo();
        });

        // Fallback: esconder loading após 3 segundos
        setTimeout(() => {
          if (loadingElement && loadingElement.style.display !== "none") {
            loadingElement.style.display = "none";
          }
        }, 3000);
      } else {
        showVideoError(
          "Vídeo não encontrado. Coloque o arquivo em: " +
            VIDEO_CONFIG.VIDEO_SOURCE
        );
      }
    })
    .catch((error) => {
      console.error("Erro ao verificar vídeo:", error);
      showVideoError("Erro ao carregar o vídeo");
    });
}

// ============================================
// CONFIGURAR CONTROLES DO VÍDEO
// ============================================

function setupVideoControls() {
  // Botão Play/Pause
  const playPauseBtn = document.getElementById("playPauseBtn");
  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", togglePlayPause);
  }

  // Botão Mute/Unmute
  const muteBtn = document.getElementById("muteBtn");
  if (muteBtn) {
    muteBtn.addEventListener("click", toggleMute);
  }

  // Controle de volume
  const volumeSlider = document.getElementById("volumeSlider");
  if (volumeSlider) {
    volumeSlider.addEventListener("input", function () {
      if (videoPlayer) {
        videoPlayer.volume = this.value / 100;
        updateMuteButton();
      }
    });
  }

  // Barra de progresso
  const progressBar = document.getElementById("progressBar");
  if (progressBar) {
    progressBar.addEventListener("input", function () {
      if (videoPlayer) {
        const time = (this.value / 100) * videoPlayer.duration;
        videoPlayer.currentTime = time;
      }
    });
  }

  // Botão de velocidade
  const speedBtn = document.getElementById("speedBtn");
  if (speedBtn) {
    speedBtn.addEventListener("click", changePlaybackSpeed);
  }
}

function setupVideoEvents() {
  if (!videoPlayer) return;

  // Atualizar tempo atual
  videoPlayer.addEventListener("timeupdate", function () {
    updateTimeDisplay();
    updateProgressBar();
  });

  // Atualizar duração total
  videoPlayer.addEventListener("loadedmetadata", function () {
    updateTimeDisplay();
    updateVideoDurationDisplay();
  });

  // Atualizar botão play/pause
  videoPlayer.addEventListener("play", function () {
    isPlaying = true;
    updatePlayPauseButton();
  });

  videoPlayer.addEventListener("pause", function () {
    isPlaying = false;
    updatePlayPauseButton();
  });

  // Fim do vídeo
  videoPlayer.addEventListener("ended", function () {
    isPlaying = false;
    updatePlayPauseButton();
  });

  // Tratar erros
  videoPlayer.addEventListener("error", function (e) {
    console.error("Erro no vídeo:", e);
    showVideoError("Erro ao reproduzir o vídeo");
  });
}

// ============================================
// FUNÇÕES DE CONTROLE
// ============================================

function togglePlayPause() {
  if (!videoPlayer) return;

  if (videoPlayer.paused) {
    videoPlayer.play();
    isPlaying = true;
  } else {
    videoPlayer.pause();
    isPlaying = false;
  }

  updatePlayPauseButton();
}

function toggleMute() {
  if (!videoPlayer) return;

  if (videoPlayer.muted) {
    videoPlayer.muted = false;
    videoPlayer.volume = lastVolume / 100;
    document.getElementById("volumeSlider").value = lastVolume;
  } else {
    lastVolume = videoPlayer.volume * 100;
    videoPlayer.muted = true;
    document.getElementById("volumeSlider").value = 0;
  }

  isMuted = videoPlayer.muted;
  updateMuteButton();
}

function changePlaybackSpeed() {
  if (!videoPlayer) return;

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const currentIndex = speeds.indexOf(currentPlaybackRate);
  const nextIndex = (currentIndex + 1) % speeds.length;

  currentPlaybackRate = speeds[nextIndex];
  videoPlayer.playbackRate = currentPlaybackRate;

  const speedBtn = document.getElementById("speedBtn");
  if (speedBtn) {
    speedBtn.innerHTML = `<i class="fas fa-tachometer-alt"></i> Velocidade: ${currentPlaybackRate}x`;
  }
}

// ============================================
// ATUALIZAR DISPLAY
// ============================================

function updatePlayPauseButton() {
  const btn = document.getElementById("playPauseBtn");
  if (!btn) return;

  if (isPlaying) {
    btn.innerHTML = '<i class="fas fa-pause"></i> <span>Pause</span>';
    btn.classList.add("playing");
  } else {
    btn.innerHTML = '<i class="fas fa-play"></i> <span>Play</span>';
    btn.classList.remove("playing");
  }
}

function updateMuteButton() {
  const btn = document.getElementById("muteBtn");
  if (!btn || !videoPlayer) return;

  if (videoPlayer.muted || videoPlayer.volume === 0) {
    btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
  } else if (videoPlayer.volume < 0.5) {
    btn.innerHTML = '<i class="fas fa-volume-down"></i>';
  } else {
    btn.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
}

function updateTimeDisplay() {
  if (!videoPlayer) return;

  const currentTime = document.getElementById("currentTime");
  const duration = document.getElementById("duration");

  if (currentTime) {
    currentTime.textContent = formatTime(videoPlayer.currentTime);
  }

  if (duration) {
    duration.textContent = formatTime(videoPlayer.duration);
  }
}

function updateVideoDurationDisplay() {
  const durationElement = document.getElementById("videoDuration");
  if (durationElement && videoPlayer) {
    durationElement.textContent = formatTime(videoPlayer.duration);
  }
}

function updateProgressBar() {
  if (!videoPlayer) return;

  const progressBar = document.getElementById("progressBar");
  if (progressBar && videoPlayer.duration) {
    const percentage = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressBar.value = percentage;
  }
}

function updateVideoInfo() {
  if (!videoPlayer) return;

  // Atualizar duração no info panel
  const durationElement = document.getElementById("videoDuration");
  if (durationElement) {
    durationElement.textContent = formatTime(videoPlayer.duration);
  }

  // Atualizar outras informações se necessário
  VIDEO_CONFIG.VIDEO_INFO.duration = formatTime(videoPlayer.duration);
}

// ============================================
// BOTÕES DE AÇÃO
// ============================================

function setupActionButtons() {
  // Tela cheia
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", toggleFullscreen);
  }

  // Download
  const downloadBtn = document.getElementById("downloadBtn");
  if (downloadBtn) {
    setupDownloadButton(downloadBtn);
  }
}

function toggleFullscreen() {
  const videoContainer = document.querySelector(".video-container");
  const videoElement = document.getElementById("mainVideo");
  const element = videoElement || videoContainer;

  if (!document.fullscreenElement) {
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

function setupDownloadButton(button) {
  if (!VIDEO_CONFIG.DOWNLOAD_URL) {
    button.style.display = "none";
    return;
  }

  checkFileExists(VIDEO_CONFIG.DOWNLOAD_URL)
    .then((exists) => {
      if (exists) {
        button.href = VIDEO_CONFIG.DOWNLOAD_URL;
        button.download = VIDEO_CONFIG.DOWNLOAD_FILENAME;
        button.target = "_blank";
      } else {
        button.innerHTML =
          '<i class="fas fa-exclamation-circle"></i> Vídeo Indisponível';
        button.style.opacity = "0.7";
        button.style.cursor = "not-allowed";
        button.onclick = function (e) {
          e.preventDefault();
          alert(
            `Vídeo não encontrado.\n\nColoque o arquivo em:\n${VIDEO_CONFIG.DOWNLOAD_URL}`
          );
        };
      }
    })
    .catch((error) => {
      console.error("Erro ao verificar vídeo:", error);
      button.style.display = "none";
    });
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function checkVideoExists(url) {
  return new Promise((resolve) => {
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

function checkFileExists(url) {
  return checkVideoExists(url); // Reutiliza a mesma função
}

function showVideoError(message) {
  const videoContainer = document.querySelector(".video-container");
  const loadingElement = document.getElementById("videoLoading");

  if (loadingElement) {
    loadingElement.innerHTML = `
            <div class="status-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao Carregar Vídeo</h3>
                <p>${message}</p>
                <p style="margin-top: 15px; font-size: 0.9rem;">
                    Edite o arquivo <strong>video.js</strong> e configure o caminho do vídeo.
                </p>
            </div>
        `;
  } else if (videoContainer) {
    videoContainer.innerHTML += `
            <div class="status-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao Carregar Vídeo</h3>
                <p>${message}</p>
            </div>
        `;
  }

  console.error("❌ Erro no vídeo:", message);
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
// NAVEGAÇÃO POR TECLADO
// ============================================

document.addEventListener("keydown", function (e) {
  if (!videoPlayer) return;

  switch (e.key) {
    case " ":
    case "Spacebar":
      e.preventDefault();
      togglePlayPause();
      break;

    case "f":
    case "F":
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      toggleFullscreen();
      break;

    case "m":
    case "M":
      e.preventDefault();
      toggleMute();
      break;

    case "ArrowLeft":
      e.preventDefault();
      if (videoPlayer) {
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
      }
      break;

    case "ArrowRight":
      e.preventDefault();
      if (videoPlayer) {
        videoPlayer.currentTime = Math.min(
          videoPlayer.duration,
          videoPlayer.currentTime + 10
        );
      }
      break;

    case "Escape":
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      ) {
        toggleFullscreen();
      }
      break;
  }
});
