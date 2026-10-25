
(() => {
  "use strict";

  const config = window.CONFIG || {};
  const $ = (selector) => document.querySelector(selector);

  // ==========================================
  // HÀM DÙNG CHUNG
  // ==========================================

  function safeUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";

    try {
      const url = new URL(value, window.location.href);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function setText(selector, value) {
    const el = $(selector);
    if (el && value !== undefined && value !== null) {
      el.textContent = value;
    }
  }

  function setImage(selector, value) {
    const el = $(selector);
    const url = safeUrl(value);
    if (!el || !url) return;

    el.onerror = () => {
      console.warn("Không tải được ảnh:", url);
    };
    el.src = url;
  }

  function setLink(selector, value) {
    const el = $(selector);
    const url = safeUrl(value);
    if (!el || !url) return;

    el.href = url;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  }

  // ==========================================
  // 1. HỒ SƠ
  // ==========================================

  setText("#displayName", config.displayName || "mvu");
  setText("#handle", config.handle || "@.minhhvu");
  setText("#bio", config.bio || "Backend Developer");

  // ==========================================
  // 2. NỀN, BANNER VÀ ẢNH
  // ==========================================

  const background = $("#background");
  const backgroundUrl = safeUrl(config.backgroundUrl);

  if (background && backgroundUrl) {
    background.style.backgroundImage = `url("${backgroundUrl}")`;
    background.style.backgroundSize = "cover";
    background.style.backgroundPosition = "center";
    background.style.backgroundRepeat = "no-repeat";
  }

  // ID đúng theo index.html
  setImage("#bannerImage", config.bannerUrl);
  setImage("#musicCover", config.musicCoverUrl);

  // ==========================================
  // 3. LIÊN KẾT MẠNG XÃ HỘI
  // ==========================================

  setLink("#discordLink", config.discordUrl);
  setLink("#instagramLink", config.instagramUrl);
  setLink("#facebookLink", config.facebookUrl);

  // ==========================================
  // 4. HIỆU ỨNG GÕ CHỮ MÀN HÌNH CHỜ
  // ==========================================

  const startScreen = $("#startScreen");
  const startButton = $("#startButton");
  const title = $(".glitch-name");

  // Gõ từng dòng thông tin khởi động
  const bootLines = startScreen
    ? Array.from(startScreen.querySelectorAll(".boot-info span"))
    : [];

  bootLines.forEach((line, index) => {
    const fullText = line.textContent.trim();
    line.textContent = "";
    line.style.visibility = "visible";

    let charIndex = 0;

    function typeLine() {
      if (!startScreen || !startScreen.isConnected) return;

      line.textContent = fullText.slice(0, charIndex);
      charIndex++;

      if (charIndex <= fullText.length) {
        window.setTimeout(typeLine, 35);
      } else if (bootLines[index + 1]) {
        window.setTimeout(() => {
          bootLines[index + 1].dataset.typeStarted = "true";
          typeBootLine(index + 1);
        }, 160);
      }
    }

    function typeBootLine(lineIndex) {
      const nextLine = bootLines[lineIndex];
      if (!nextLine || !startScreen?.isConnected) return;

      const text = nextLine.dataset.fullText || nextLine.textContent;
      nextLine.dataset.fullText = text;
      nextLine.textContent = "";

      let i = 0;

      function step() {
        if (!startScreen.isConnected) return;
        nextLine.textContent = text.slice(0, i);
        i++;

        if (i <= text.length) {
          window.setTimeout(step, 35);
        } else if (bootLines[lineIndex + 1]) {
          window.setTimeout(() => typeBootLine(lineIndex + 1), 160);
        }
      }

      step();
    }

    line.dataset.fullText = fullText;

    if (index === 0) {
      typeLine();
    }
  });

  // Hiệu ứng gõ tên trên màn hình chờ
  if (title) {
    const fullTitle =
      title.dataset.text || title.textContent.trim();

    title.textContent = "";
    let index = 0;

    function typeTitle() {
      if (startScreen && !startScreen.isConnected) return;

      title.textContent = fullTitle.slice(0, index);
      index++;

      if (index <= fullTitle.length) {
        window.setTimeout(typeTitle, 100);
      }
    }

    typeTitle();
  }

  // ==========================================
  // 5. NHẠC NỀN
  // ==========================================

  const audio = $("#backgroundMusic");

  setText("#musicTitle", config.musicTitle || "Your Favorite Song");
  setText("#musicArtist", config.musicArtist || "Your Favorite Artist");

  if (audio) {
    const audioUrl = safeUrl(config.musicAudioUrl);

    audio.pause();
    audio.autoplay = false;
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";

    if (audioUrl) {
      audio.src = audioUrl;
      audio.load();
    }

    audio.addEventListener("play", () => {
      document.body.classList.add("music-playing");
    });

    audio.addEventListener("pause", () => {
      document.body.classList.remove("music-playing");
    });

    audio.addEventListener("error", () => {
      console.error(
        "Không tải được nhạc. Kiểm tra musicAudioUrl trong config.js."
      );
    });
  }

  // ==========================================
  // 6. CLICK TO START
  // ==========================================

  let started = false;

  async function startWebsite(event) {
    event?.preventDefault();

    if (started) return;
    started = true;

    // Phát nhạc từ thao tác click của người dùng
    if (audio && audio.src) {
      try {
        await audio.play();
        console.log("Nhạc đang phát.");
      } catch (error) {
        console.error("Lỗi phát nhạc:", error);
      }
    } else {
      console.warn("Chưa có file nhạc hợp lệ.");
    }

    if (startScreen) {
      startScreen.classList.add("is-leaving");

      window.setTimeout(() => {
        startScreen.remove();
      }, 500);
    }
  }

  if (startButton) {
    startButton.addEventListener("click", startWebsite);
  }

  // ==========================================
  // 7. DISCORD PROFILE
  // ==========================================

  async function loadDiscord() {
    const discordId = String(config.discordId || "").trim();

    if (!/^\d{17,20}$/.test(discordId)) {
      console.warn("Discord ID chưa hợp lệ.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.lanyard.rest/v1/users/${discordId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Không có dữ liệu Discord.");
      }

      const data = result.data;
      const user = data.discord_user || {};

      // Avatar Discord
      if (user.id && user.avatar) {
        const extension = user.avatar.startsWith("a_")
          ? "gif"
          : "png";

        setImage(
          "#avatar",
          `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`
        );
      } else if (user.id) {
        const defaultAvatar =
          Number(user.discriminator || 0) % 6;

        setImage(
          "#avatar",
          `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`
        );
      }

      // Trạng thái Discord
      const status = data.discord_status || "offline";

      const statusNames = {
        online: "Online",
        idle: "Idle",
        dnd: "Do Not Disturb",
        offline: "Offline"
      };

      setText("#discordStatus", statusNames[status] || "Offline");

      const dot = $("#activityDot");

      if (dot) {
        dot.classList.remove("online", "idle", "dnd", "offline");
        dot.classList.add(status);
      }

      // Hoạt động đang chơi
      const activities = data.activities || [];
      const activity = activities.find(
        (item) => item.type !== 4 && item.name
      );

      if (activity) {
        setText("#activityText", "CURRENT ACTIVITY");
        setText("#activityName", activity.name);
        setText(
          "#activityDetails",
          activity.details || activity.state || "Đang hoạt động"
        );
      } else {
        setText("#activityText", "MY DIGITAL SPACE");
        setText("#activityName", "Chưa có hoạt động");
        setText(
          "#activityDetails",
          "Hoạt động Discord sẽ hiển thị tại đây"
        );
      }

      // Spotify đang nghe trên Discord
      const spotify = data.spotify;

      if (spotify && spotify.song) {
        setText("#musicTitle", spotify.song);
        setText("#musicArtist", spotify.artist || "");

        if (spotify.album_art_url) {
          setImage("#musicCover", spotify.album_art_url);
        }
      }

      console.log("Đã tải dữ liệu Discord.");
    } catch (error) {
      console.warn("Không tải được Discord:", error);
      setText("#discordStatus", "Discord không khả dụng");
    }
  }

  loadDiscord();

  // ==========================================
  // 8. HIỆU ỨNG HẠT THEO CHUỘT
  // ==========================================

  const particleStyle = document.createElement("style");

  particleStyle.textContent = `
    @keyframes mvParticleFade {
      from {
        opacity: 0.9;
        transform: translate(-50%, -50%) scale(1);
      }
      to {
        opacity: 0;
        transform: translate(-50%, -90%) scale(0);
      }
    }

    .mv-mouse-particle {
      position: fixed;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #a78bfa;
      box-shadow: 0 0 10px #8b5cf6;
      pointer-events: none;
      z-index: 99999;
      animation: mvParticleFade 600ms ease-out forwards;
    }
  `;

  document.head.appendChild(particleStyle);

  let lastParticleTime = 0;

  document.addEventListener("pointermove", (event) => {
    const now = Date.now();

    if (now - lastParticleTime < 35) return;
    lastParticleTime = now;

    const particle = document.createElement("span");
    particle.className = "mv-mouse-particle";

    particle.style.left = `${event.clientX}px`;
    particle.style.top = `${event.clientY}px`;

    document.body.appendChild(particle);

    window.setTimeout(() => particle.remove(), 650);
  });

  console.log("mv.dev đã khởi tạo.");
})();
