
(() => {
  "use strict";

  const config = window.CONFIG || {};
  const $ = (selector) => document.querySelector(selector);

  // ==========================================
  // 1. HÀM DÙNG CHUNG
  // ==========================================

  function safeUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";

    try {
      const url = new URL(value, window.location.href);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.href;
      }
    } catch (_) {}

    return "";
  }

  function setText(selector, value) {
    const element = $(selector);
    if (element && value !== undefined && value !== null) {
      element.textContent = value;
    }
  }

  function setImage(selector, url) {
    const element = $(selector);
    const validUrl = safeUrl(url);

    if (element && validUrl) {
      element.src = validUrl;
      element.style.display = "";
    }
  }

  function setLink(selector, url) {
    const element = $(selector);
    const validUrl = safeUrl(url);

    if (element && validUrl) {
      element.href = validUrl;
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    }
  }

  // ==========================================
  // 2. THÔNG TIN CÁ NHÂN
  // ==========================================

  setText("#displayName", config.displayName || "Minh Vũ");
  setText("#handle", config.handle || "@.minhhvu");
  setText(
    "#bio",
    config.bio || "Backend Developer • Learning something new every day"
  );

  // ==========================================
  // 3. NỀN WEBSITE VÀ BANNER
  // ==========================================

  const background = $("#background");
  const backgroundUrl = safeUrl(config.backgroundUrl);

  if (background && backgroundUrl) {
    background.style.backgroundImage = `url("${backgroundUrl}")`;
    background.style.backgroundSize = "cover";
    background.style.backgroundPosition = "center";
    background.style.backgroundRepeat = "no-repeat";
  }

  // Dùng đúng ID trong index.html
  setImage("#bannerImage", config.bannerUrl);
  setImage("#musicCover", config.musicCoverUrl);

  // ==========================================
  // 4. CÁC LIÊN KẾT MẠNG XÃ HỘI
  // ==========================================

  setLink("#discordLink", config.discordUrl);
  setLink("#instagramLink", config.instagramUrl);
  setLink("#facebookLink", config.facebookUrl);

  // ==========================================
  // 5. NHẠC NỀN
  // ==========================================

  const audio = $("#backgroundMusic");

  if (audio) {
    const audioUrl = safeUrl(config.musicAudioUrl);

    audio.pause();
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";

    if (audioUrl) {
      audio.src = audioUrl;
      audio.load();
    }

    // Cập nhật chỉ báo nhạc nếu có
    audio.addEventListener("play", () => {
      document.body.classList.add("music-playing");
    });

    audio.addEventListener("pause", () => {
      document.body.classList.remove("music-playing");
    });

    audio.addEventListener("error", () => {
      console.error(
        "Không tải được nhạc. Hãy kiểm tra musicAudioUrl trong config.js."
      );
    });
  }

  // Thông tin bài nhạc mặc định
  setText("#musicTitle", config.musicTitle || "Your Favorite Song");
  setText("#musicArtist", config.musicArtist || "Your Favorite Artist");

  // ==========================================
  // 6. MÀN HÌNH CHỜ - CLICK TO START
  // ==========================================

  const startScreen = $("#startScreen");
  const startButton = $("#startButton");

  let started = false;

  async function startWebsite(event) {
    if (event) event.preventDefault();
    if (started) return;

    started = true;

    // Bắt đầu phát nhạc từ thao tác click
    if (audio && audio.getAttribute("src")) {
      try {
        await audio.play();
        console.log("Nhạc nền đang phát.");
      } catch (error) {
        console.error("Không thể phát nhạc:", error);
        started = false;
      }
    } else {
      console.error(
        "Chưa có file nhạc. Hãy kiểm tra musicAudioUrl trong config.js."
      );
      started = false;
    }

    // Dù nhạc có phát được hay không, vẫn cho phép vào website
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
  // 7. DISCORD PROFILE - LANYARD API
  // ==========================================

  async function loadDiscord() {
    const discordId = String(config.discordId || "").trim();

    if (!/^\d{17,20}$/.test(discordId)) {
      setText("#discordStatus", "Discord chưa được cấu hình");
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
        throw new Error("Không lấy được dữ liệu Discord.");
      }

      const data = result.data;
      const user = data.discord_user || {};

      // Avatar Discord
      if (user.id && user.avatar) {
        const extension = user.avatar.startsWith("a_") ? "gif" : "png";

        setImage(
          "#avatar",
          `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`
        );
      }

      // Nếu không có avatar Discord, giữ ảnh hiện có
      // Trạng thái Discord
      const statusNames = {
        online: "Online",
        idle: "Idle",
        dnd: "Do Not Disturb",
        offline: "Offline"
      };

      const status = data.discord_status || "offline";

      setText("#discordStatus", statusNames[status] || "Offline");

      const statusElement = $("#discordStatus");
      if (statusElement) {
        statusElement.dataset.status = status;
      }

      const activityDot = $("#activityDot");

      if (activityDot) {
        activityDot.classList.remove("online", "idle", "dnd", "offline");
        activityDot.classList.add(status);
      }

      // Hoạt động Discord
      const activities = data.activities || [];

      const activity = activities.find(
        (item) => item.type !== 4 && item.name
      );

      if (activity) {
        setText("#activityName", activity.name);
        setText(
          "#activityDetails",
          activity.details || activity.state || "Đang hoạt động"
        );
        setText("#activityText", "CURRENT ACTIVITY");
      } else {
        setText("#activityName", "Chưa có hoạt động");
        setText(
          "#activityDetails",
          "Hoạt động Discord sẽ hiển thị tại đây"
        );
        setText("#activityText", "MY DIGITAL SPACE");
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

      console.log("Đã cập nhật thông tin Discord.");
    } catch (error) {
      console.warn("Không thể tải dữ liệu Discord:", error);
      setText("#discordStatus", "Discord không khả dụng");
    }
  }

  loadDiscord();

  // ==========================================
  // 8. HIỆU ỨNG HẠT THEO CHUỘT
  // ==========================================

  let lastParticleTime = 0;

  document.addEventListener("pointermove", (event) => {
    const now = Date.now();

    // Giới hạn số hạt để tránh làm chậm website
    if (now - lastParticleTime < 35) return;
    lastParticleTime = now;

    const particle = document.createElement("span");
    particle.className = "mouse-particle";

    particle.style.position = "fixed";
    particle.style.left = `${event.clientX}px`;
    particle.style.top = `${event.clientY}px`;
    particle.style.width = "5px";
    particle.style.height = "5px";
    particle.style.borderRadius = "50%";
    particle.style.background = "#a78bfa";
    particle.style.boxShadow = "0 0 10px #8b5cf6";
    particle.style.pointerEvents = "none";
    particle.style.zIndex = "99999";
    particle.style.transform = "translate(-50%, -50%)";
    particle.style.animation = "mouseParticleFade 600ms ease-out forwards";

    document.body.appendChild(particle);

    window.setTimeout(() => particle.remove(), 650);
  });

  // ==========================================
  // 9. BẢO VỆ LỖI ẢNH
  // ==========================================

  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => {
      console.warn("Không tải được ảnh:", image.src);

      // Không ẩn avatar/banner tự động để tránh làm lệch giao diện
      image.dataset.imageError = "true";
    });
  });

  console.log("mv.dev đã khởi tạo.");
})();
