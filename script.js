
(() => {
  "use strict";

  const config = window.CONFIG || {};
  const $ = (selector) => document.querySelector(selector);

  // ==========================================
  // 1. CẤU HÌNH HỒ SƠ
  // ==========================================

  function setText(selector, value) {
    const element = $(selector);
    if (element && value !== undefined && value !== null) {
      element.textContent = value;
    }
  }

  function setImage(selector, url) {
    const element = $(selector);
    if (element && url) {
      element.src = url;
      element.style.display = "";
    }
  }

  function setLink(selector, url) {
    const element = $(selector);
    if (element && url) {
      element.href = url;
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    }
  }

  function safeUrl(value) {
    if (typeof value !== "string") return "";

    try {
      const url = new URL(value, window.location.href);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.href;
      }
    } catch (_) {}

    return "";
  }

  // Tên và mô tả
  setText("#displayName", config.displayName || "mvu");
  setText("#handle", config.handle || "@.minhhvu");
  setText("#bio", config.bio || "Backend Developer");

  // Ảnh nền và banner
  const backgroundUrl = safeUrl(config.backgroundUrl);
  if (backgroundUrl) {
    document.body.style.backgroundImage =
      `linear-gradient(rgba(5, 3, 12, .45), rgba(5, 3, 12, .75)), url("${backgroundUrl}")`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
  }

  setImage("#banner", safeUrl(config.bannerUrl));
  setImage("#musicCover", safeUrl(config.musicCoverUrl));

  // Liên kết mạng xã hội
  setLink("#discordLink", safeUrl(config.discordUrl));
  setLink("#instagramLink", safeUrl(config.instagramUrl));
  setLink("#facebookLink", safeUrl(config.facebookUrl));

  // ==========================================
  // 2. NHẠC NỀN
  // Nhạc phát khi nhấn nút click to start
  // ==========================================

  const audio = $("#backgroundMusic");

  if (audio) {
    const audioUrl = safeUrl(config.musicAudioUrl);

    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";

    if (audioUrl) {
      audio.src = audioUrl;
      audio.load();
    }
  }

  // ==========================================
  // 3. MÀN HÌNH CHỜ
  // ==========================================

  const startScreen = $("#startScreen");
  const startButton = $("#startButton");

  let websiteStarted = false;

  async function startWebsite(event) {
    if (event) {
      event.preventDefault();
    }

    if (websiteStarted) return;
    websiteStarted = true;

    // Phát nhạc trực tiếp từ thao tác click của người dùng
    if (audio && audio.src) {
      try {
        await audio.play();
        console.log("Nhạc nền đang phát.");
      } catch (error) {
        console.error(
          "Không thể phát nhạc. Hãy kiểm tra musicAudioUrl:",
          error
        );
      }
    } else {
      console.error(
        "Chưa có đường dẫn nhạc hợp lệ trong config.js."
      );
    }

    // Đóng màn hình chờ
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
  // 4. DISCORD PROFILE / LANYARD
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
        throw new Error("Không lấy được dữ liệu Discord.");
      }

      const data = result.data;
      const user = data.discord_user || {};

      const discordName =
        user.global_name || user.display_name || user.username || "Discord";

      setText("#discordName", discordName);
      setText("#discordUsername", user.username ? `@${user.username}` : "");

      // Trạng thái Discord
      const statusNames = {
        online: "Online",
        idle: "Idle",
        dnd: "Do Not Disturb",
        offline: "Offline"
      };

      setText(
        "#discordStatus",
        statusNames[data.discord_status] || "Offline"
      );

      const statusElement = $("#discordStatus");
      if (statusElement) {
        statusElement.dataset.status = data.discord_status || "offline";
      }

      // Avatar Discord
      if (user.id && user.avatar) {
        const extension = user.avatar.startsWith("a_")
          ? "gif"
          : "png";

        setImage(
          "#discordAvatar",
          `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`
        );
      }

      // Banner Discord
      if (user.id && user.banner) {
        const extension = user.banner.startsWith("a_")
          ? "gif"
          : "png";

        setImage(
          "#discordBanner",
          `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${extension}?size=1024`
        );
      }

      // Spotify / hoạt động đang diễn ra
      const spotify = data.spotify;

      if (spotify && spotify.song) {
        setText("#spotifyTitle", spotify.song);
        setText("#spotifyArtist", spotify.artist || "");
        setImage("#spotifyCover", spotify.album_art_url || "");
        setText("#musicTitle", spotify.song);
        setText("#musicArtist", spotify.artist || "");
      } else {
        const activities = data.activities || [];
        const activity = activities.find(
          (item) => item.type !== 4 && item.name
        );

        if (activity) {
          setText("#discordActivity", activity.name);
          setText("#discordActivityDetails", activity.details || "");
        }
      }

      console.log("Đã cập nhật thông tin Discord.");
    } catch (error) {
      console.warn("Không tải được Discord/Lanyard:", error);
    }
  }

  loadDiscord();

  // ==========================================
  // 5. THÔNG TIN BÀI NHẠC CỐ ĐỊNH
  // ==========================================

  if (config.musicTitle) {
    setText("#musicTitle", config.musicTitle);
    setText("#spotifyTitle", config.musicTitle);
  }

  if (config.musicArtist) {
    setText("#musicArtist", config.musicArtist);
    setText("#spotifyArtist", config.musicArtist);
  }

  // Không tự động phát nhạc khi tải trang.
  // Nhạc chỉ bắt đầu khi người dùng nhấn click to start.

})();
