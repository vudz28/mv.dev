
(() => {
  "use strict";

  const config = window.CONFIG || {};
  const $ = (selector) => document.querySelector(selector);

  // ==========================================
  // 1. CÁC HÀM DÙNG CHUNG
  // ==========================================

  function safeUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";

    try {
      const url = new URL(value, window.location.href);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.href;
      }
    } catch (error) {
      console.warn("URL không hợp lệ:", value);
    }

    return "";
  }

  function setText(selector, value) {
    const element = $(selector);

    if (element && value !== undefined && value !== null) {
      element.textContent = value;
    }
  }

  function setImage(selector, value) {
    const element = $(selector);
    const url = safeUrl(value);

    if (!element || !url) return;

    element.onerror = () => {
      console.warn("Không tải được ảnh:", url);
      element.dataset.imageError = "true";
    };

    element.onload = () => {
      delete element.dataset.imageError;
    };

    if (element.src !== url) {
      element.src = url;
    }

    element.style.display = "";
  }

  function setLink(selector, value) {
    const element = $(selector);
    const url = safeUrl(value);

    if (!element || !url) return;

    element.href = url;
    element.target = "_blank";
    element.rel = "noopener noreferrer";
  }

  // ==========================================
  // 2. THÔNG TIN HỒ SƠ
  // ==========================================

  setText("#displayName", config.displayName || "mvu");
  setText("#handle", config.handle || "@.minhhvu");
  setText("#bio", config.bio || "Backend Developer");

  // ==========================================
  // 3. NỀN, BANNER VÀ ẢNH BÌA
  // ==========================================

  const background = $("#background");
  const backgroundUrl = safeUrl(config.backgroundUrl);

  if (background && backgroundUrl) {
    background.style.backgroundImage = `url("${backgroundUrl}")`;
    background.style.backgroundSize = "cover";
    background.style.backgroundPosition = "center";
    background.style.backgroundRepeat = "no-repeat";
  }

  // Đúng ID trong index.html
  setImage("#bannerImage", config.bannerUrl);
  setImage("#musicCover", config.musicCoverUrl);

  // ==========================================
  // 4. LIÊN KẾT MẠNG XÃ HỘI
  // ==========================================

  setLink("#discordLink", config.discordUrl);
  setLink("#instagramLink", config.instagramUrl);
  setLink("#facebookLink", config.facebookUrl);

  // ==========================================
  // 5. NHẠC NỀN
  // ==========================================

  const audio = $("#backgroundMusic");

  setText("#musicTitle", config.musicTitle || "Your Favorite Song");
  setText("#musicArtist", config.musicArtist || "Your Favorite Artist");

  if (audio) {
    const audioUrl = safeUrl(config.musicAudioUrl);

    audio.pause();
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";
    audio.autoplay = false;

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
        "Lỗi tải nhạc. Hãy kiểm tra file music.mp3 và musicAudioUrl."
      );
    });
  }

  // ==========================================
  // 6. NÚT CLICK TO START
  // ==========================================

  const startScreen = $("#startScreen");
  const startButton = $("#startButton");
  let started = false;

  async function startWebsite(event) {
    if (event) event.preventDefault();
    if (started) return;

    started = true;

    // Gọi play() ngay trong thao tác click
    if (audio && audio.src) {
      try {
        await audio.play();
        console.log("Nhạc nền đang phát.");
      } catch (error) {
        console.error("Không phát được nhạc:", error);
      }
    } else {
      console.error("Chưa cấu hình file nhạc hợp lệ.");
    }

    // Luôn đóng màn hình chờ dù nhạc có lỗi
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
        throw new Error("Không có dữ liệu Discord");
      }

      const data = result.data;
      const user = data.discord_user || {};

      // Avatar: ID đúng là #avatar
      if (user.id && user.avatar) {
        const extension = user.avatar.startsWith("a_")
          ? "gif"
          : "png";

        setImage(
          "#avatar",
          `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`
        );
      } else if (user.id) {
        const defaultIndex = Number(user.discriminator || 0) % 6;

        setImage(
          "#avatar",
          `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`
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

      const activityDot = $("#activityDot");

      if (activityDot) {
        activityDot.classList.remove(
          "online",
          "idle",
          "dnd",
          "offline"
        );

        activityDot.classList.add(status);
      }

      // Hoạt động hiện tại
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

      console.log("Đã tải dữ liệu Discord.");
    } catch (error) {
      console.warn("Không tải được Discord:", error);
      setText("#discordStatus", "Discord không khả dụng");
    }
  }

  loadDiscord();

  console.log("mv.dev script đã khởi tạo.");
})();
