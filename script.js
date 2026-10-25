
(() => {
  "use strict";

  const config = window.CONFIG || {};
  const $ = (selector) => document.querySelector(selector);

  const setText = (selector, value) => {
    const el = $(selector);
    if (el && value != null) el.textContent = value;
  };

  const setImage = (selector, url) => {
    const el = $(selector);
    if (el && url) {
      el.src = url;
      el.style.display = "";
    }
  };

  const setLink = (selector, url) => {
    const el = $(selector);
    if (el && url) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    }
  };

  const safeUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };

  // Hồ sơ
  setText("#displayName", config.displayName || "mvu");
  setText("#handle", config.handle || "@.minhhvu");
  setText("#bio", config.bio || "Backend Developer");

  // Ảnh nền và banner: dùng đúng ID trong index.html
  const background = $("#background");
  const backgroundUrl = safeUrl(config.backgroundUrl);

  if (background && backgroundUrl) {
    background.style.backgroundImage =
      `linear-gradient(rgba(5,3,12,.4),rgba(5,3,12,.7)),url("${backgroundUrl}")`;
    background.style.backgroundSize = "cover";
    background.style.backgroundPosition = "center";
    background.style.backgroundRepeat = "no-repeat";
  }

  setImage("#bannerImage", safeUrl(config.bannerUrl));
  setImage("#musicCover", safeUrl(config.musicCoverUrl));

  setLink("#discordLink", safeUrl(config.discordUrl));
  setLink("#instagramLink", safeUrl(config.instagramUrl));
  setLink("#facebookLink", safeUrl(config.facebookUrl));

  // Nhạc nền
  const audio = $("#backgroundMusic");

  if (audio) {
    audio.autoplay = false;
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";

    const musicUrl = safeUrl(config.musicAudioUrl);
    if (musicUrl) audio.src = musicUrl;
  }

  // Màn hình chờ: bấm ở bất kỳ đâu để vào trang
  const startScreen = $("#startScreen");
  const startButton = $("#startButton");
  let websiteStarted = false;

  async function startWebsite(event) {
    if (event) event.preventDefault();
    if (websiteStarted) return;
    websiteStarted = true;

    if (audio && audio.src) {
      try {
        await audio.play();
      } catch (error) {
        console.warn("Không phát được nhạc. Hãy kiểm tra musicAudioUrl.", error);
      }
    }

    if (startScreen) {
      startScreen.classList.add("is-leaving");
      window.setTimeout(() => startScreen.remove(), 500);
    }
  }

  if (startScreen) {
    startScreen.addEventListener("click", startWebsite);
    startScreen.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        startWebsite(event);
      }
    });
  }

  // Nút vẫn hoạt động; click nút không kích hoạt hai lần
  if (startButton) {
    startButton.addEventListener("click", (event) => {
      event.stopPropagation();
      startWebsite(event);
    });
  }

  // Hiệu ứng gõ, xóa rồi gõ lại tên @.minhhvu
  const title = $(".glitch-name");

  if (title) {
    const fullName = title.dataset.text || title.textContent.trim();
    title.dataset.text = fullName;
    title.textContent = "";

    let index = 0;
    let deleting = false;

    function animateName() {
      if (!deleting) {
        index++;
        title.textContent = fullName.slice(0, index);

        if (index >= fullName.length) {
          deleting = true;
          window.setTimeout(animateName, 1200);
          return;
        }

        window.setTimeout(animateName, 150);
      } else {
        index--;
        title.textContent = fullName.slice(0, index);

        if (index <= 0) {
          deleting = false;
          window.setTimeout(animateName, 400);
          return;
        }

        window.setTimeout(animateName, 75);
      }
    }

    animateName();
  }

  // Hiệu ứng gõ lần lượt dòng thông tin trên màn hình chờ
  const bootLines = [...document.querySelectorAll(".boot-info span")];

  bootLines.forEach((line) => {
    line.dataset.fullText = line.textContent;
    line.textContent = "";
  });

  function typeBootLine(lineIndex = 0) {
    if (lineIndex >= bootLines.length) return;

    const line = bootLines[lineIndex];
    const fullText = line.dataset.fullText || "";
    let charIndex = 0;

    function typeCharacter() {
      line.textContent = fullText.slice(0, charIndex);
      charIndex++;

      if (charIndex <= fullText.length) {
        window.setTimeout(typeCharacter, 35);
      } else {
        window.setTimeout(() => typeBootLine(lineIndex + 1), 250);
      }
    }

    typeCharacter();
  }

  if (bootLines.length) typeBootLine();

  // Discord: cập nhật đúng các phần tử đang có trong index.html
  async function loadDiscord() {
    const discordId = String(config.discordId || "").trim();

    if (!/^\d{17,20}$/.test(discordId)) {
      setText("#discordStatus", "Chưa cấu hình Discord ID");
      return;
    }

    try {
      const response = await fetch(
        `https://api.lanyard.rest/v1/users/${discordId}`
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error("Không nhận được dữ liệu Discord");
      }

      const data = result.data;
      const user = data.discord_user || {};

      // Avatar
      if (user.id && user.avatar) {
        const extension = user.avatar.startsWith("a_") ? "gif" : "png";
        setImage(
          "#avatar",
          `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`
        );
      } else if (user.id) {
        setImage(
          "#avatar",
          `https://cdn.discordapp.com/embed/avatars/0.png`
        );
      }

      // Trạng thái
      const statusNames = {
        online: "Online",
        idle: "Idle",
        dnd: "Do Not Disturb",
        offline: "Offline"
      };

      const status = data.discord_status || "offline";
      setText("#discordStatus", statusNames[status] || "Offline");

      const dot = $("#activityDot");
      if (dot) {
        dot.classList.toggle("online", status === "online");
        dot.dataset.status = status;
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
          activity.details ||
            activity.state ||
            "Đang hoạt động trên Discord"
        );
        setText("#activityText", "DISCORD ACTIVITY");
      } else {
        setText("#activityName", "Chưa có hoạt động");
        setText("#activityDetails", "Hoạt động Discord sẽ hiển thị tại đây");
        setText("#activityText", "MY DIGITAL SPACE");
      }

      // Spotify nếu đang nghe nhạc
      if (data.spotify) {
        const spotify = data.spotify;
        setText("#musicTitle", spotify.song || "Now Playing");
        setText("#musicArtist", spotify.artist || "");
        setImage("#musicCover", spotify.album_art_url || "");
      }
    } catch (error) {
      console.error("Không thể tải dữ liệu Discord:", error);
      setText("#discordStatus", "Không tải được Discord");
      setText("#activityName", "Discord chưa kết nối dữ liệu");
      setText("#activityDetails", "Kiểm tra Discord ID hoặc kết nối Lanyard");
    }
  }

  loadDiscord();
  window.setInterval(loadDiscord, 30000);
})();
