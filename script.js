
(() => {
  "use strict";

  const config = window.CONFIG || {};

  const $ = (id) => document.getElementById(id);

  function setText(id, value) {
    if (value !== undefined && value !== null && value !== "") {
      $(id).textContent = value;
    }
  }

  // Chỉ chấp nhận các giao thức URL an toàn.
  function safeUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function setImage(id, url) {
    const image = $(id);
    const validUrl = safeUrl(url);

    if (!validUrl) {
      image.style.display = "none";
      return;
    }

    image.src = validUrl;
    image.onerror = () => {
      image.style.display = "none";
    };
  }

  // Background ảnh động.
  function setBackground(url) {
    const validUrl = safeUrl(url);
    if (!validUrl) return;

    const bg = $("background");

    // MP4 / WebM: dùng video nền.
    if (/\.(mp4|webm)(?:$|[?#])/i.test(validUrl)) {
      const video = document.createElement("video");
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("aria-hidden", "true");

      Object.assign(video.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        objectFit: "cover"
      });

      video.src = validUrl;
      bg.replaceChildren(video);

      video.play().catch(() => {
        // Một số trình duyệt có thể chặn autoplay.
      });
      return;
    }

    // GIF, WebP động hoặc ảnh tĩnh.
    bg.style.backgroundImage = `url("${validUrl.replace(/["\\\n\r]/g, "")}")`;
  }

  // Thông tin cấu hình.
  setText("displayName", config.displayName);
  setText("handle", config.handle);
  setText("bio", config.bio);
  setText("musicTitle", config.musicTitle);
  setText("musicArtist", config.musicArtist);

  setImage("bannerImage", config.bannerUrl);
  setImage("musicCover", config.musicCoverUrl);
  setBackground(config.backgroundUrl);

  const socialLinks = [
    ["discordLink", config.discordUrl],
    ["instagramLink", config.instagramUrl],
    ["facebookLink", config.facebookUrl]
  ];

  socialLinks.forEach(([id, url]) => {
    const link = $(id);
    const validUrl = safeUrl(url);

    if (validUrl) {
      link.href = validUrl;
    } else {
      link.hidden = true;
    }
  });

  // Avatar mặc định nếu Discord chưa tải được.
  const fallbackAvatar =
    "https://cdn.discordapp.com/embed/avatars/0.png";

  setImage("avatar", fallbackAvatar);

  // Lanyard: dữ liệu Discord công khai.
  async function loadDiscord() {
    const id = String(config.discordId || "").trim();

    if (!/^\d{17,20}$/.test(id)) {
      setText("discordStatus", "DISCORD PROFILE");
      return;
    }

    try {
      const response = await fetch(
        `https://api.lanyard.rest/v1/users/${encodeURIComponent(id)}`
      );

      if (!response.ok) throw new Error("Lanyard request failed");

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error("No Lanyard data");
      }

      const data = result.data;
      const user = data.discord_user;

      if (user) {
        const avatarUrl = user.avatar
          ? `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "webp"}?size=256`
          : fallbackAvatar;

        setImage("avatar", avatarUrl);
      }

      // Hiển thị các badge phổ biến có trong dữ liệu Discord.
      const flags = Number(user?.public_flags || 0);
      const badges = $("badges");
      const badgeNames = [];

      if (flags & (1 << 0)) badgeNames.push("Staff");
      if (flags & (1 << 1)) badgeNames.push("Partner");
      if (flags & (1 << 2)) badgeNames.push("HypeSquad");
      if (flags & (1 << 17)) badgeNames.push("Active Developer");

      badges.replaceChildren();

      const discordBadge = document.createElement("span");
      discordBadge.className = "badge discord-badge";
      discordBadge.textContent = "✦ Discord";
      badges.appendChild(discordBadge);

      badgeNames.forEach((name) => {
        const badge = document.createElement("span");
        badge.className = "badge discord-badge";
        badge.textContent = name;
        badges.appendChild(badge);
      });

      // Trạng thái hiện diện.
     

const status = data.discord_status || "offline";
const statusLabels = {
  online: "ONLINE ON DISCORD",
  idle: "IDLE ON DISCORD",
  dnd: "DO NOT DISTURB",
  offline: "OFFLINE ON DISCORD"
};

setText("discordStatus", statusLabels[status] || "IDLE ON DISCORD");
setText("activityText", "DISCORD STATUS");

// Chỉ hiện hoạt động khi Discord thực sự có hoạt động.
// Không hiện dòng "Chưa có hoạt động" khi danh sách rỗng.
const activities = data.activities || [];
const activity = activities.find(item => item.type !== 4);
const activityBox = $("discordActivity");

if (activity) {
  activityBox.hidden = false;
  setText("activityName", activity.name || "Đang hoạt động");
  setText(
    "activityDetails",
    activity.details || activity.state || ""
  );
} else {
  activityBox.hidden = true;
  setText("discordStatus", "IDLE ON DISCORD");
}

// Spotify Now Playing
if (data.spotify) {
  setText("musicTitle", data.spotify.song);
  setText("musicArtist", data.spotify.artist);
  setImage("musicCover", data.spotify.album_art_url);
} else {
  setText("musicTitle", config.musicTitle || "Now Playing");
  setText("musicArtist", config.musicArtist || "No track detected");
  setImage("musicCover", config.musicCoverUrl);
}


      // Nếu đang chia sẻ Spotify, cập nhật bài hát.
      if (data.spotify) {
        setText("musicTitle", data.spotify.song);
        setText("musicArtist", data.spotify.artist);
        setImage("musicCover", data.spotify.album_art_url);
      }
    } catch (error) {
      console.warn("Không tải được dữ liệu Discord:", error);
      setText("discordStatus", "DISCORD PROFILE");
    }
  }

  loadDiscord();
  
  // Background music
  const audio = $("backgroundMusic");
  const audioUrl = safeUrl(config.musicAudioUrl || "");

  if (audio && audioUrl) {
    audio.src = audioUrl;
    audio.volume = 0.35;
    audio.loop = true;

    const tryAutoplay = () => {
      audio.play().catch(() => {
        // Trình duyệt chặn autoplay có tiếng:
        // chờ lần tương tác đầu tiên của người dùng.
        const startMusic = () => {
          audio.play().catch(() => {});
          document.removeEventListener("pointerdown", startMusic);
          document.removeEventListener("keydown", startMusic);
        };

        document.addEventListener("pointerdown", startMusic);
        document.addEventListener("keydown", startMusic);
      });
    };

    tryAutoplay();
  }
```

**Lưu ý:** không thể đảm bảo nhạc phát ra tiếng ngay khi vừa mở trang trên mọi trình duyệt. Chrome và Safari thường yêu cầu người dùng tương tác trước khi cho phép tự phát có âm thanh. Đoạn code sẽ thử tự phát, rồi thử lại khi bạn chạm hoặc nhấn phím.

## 5. Thêm hiệu ứng hạt sáng bay lên theo chuột

Dán đoạn này vào cuối `style.css`:

<CodeBlock language="css" editable>
/* Mouse trail particles */
.mouse-particle {
  position: fixed;
  z-index: 9999;
  left: 0;
  top: 0;
  width: var(--particle-size, 5px);
  height: var(--particle-size, 5px);
  border-radius: 50%;
  background: var(--particle-color, #a18aff);
  box-shadow:
    0 0 8px var(--particle-color, #a18aff),
    0 0 18px rgba(133, 111, 255, .45);
  pointer-events: none;
  animation: particle-float .85s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes particle-float {
  0% {
    opacity: 0;
    transform: translate(-50%, -30%) scale(.4);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform:
      translate(
        calc(-50% + var(--drift-x, 0px)),
        calc(-50% - var(--rise, 45px))
      )
      scale(0);
  }
}

@media (hover: none), (prefers-reduced-motion: reduce) {
  .mouse-particle {
    display: none;
    animation: none;
  }
}

  // Mouse glow trail
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const touchDevice = window.matchMedia("(hover: none)").matches;

  if (!reducedMotion && !touchDevice) {
    let lastParticleTime = 0;
    let particleCount = 0;

    document.addEventListener("pointermove", (event) => {
      const now = performance.now();

      // Giới hạn số hạt để tránh làm chậm trang.
      if (now - lastParticleTime < 28 || particleCount >= 35) {
        return;
      }

      lastParticleTime = now;
      particleCount++;

      const particle = document.createElement("span");
      particle.className = "mouse-particle";

      const colors = ["#a18aff", "#7bc6ff", "#e0a8ff"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 5;
      const drift = (Math.random() - 0.5) * 65;
      const rise = 25 + Math.random() * 55;

      particle.style.left = `${event.clientX}px`;
      particle.style.top = `${event.clientY}px`;
      particle.style.setProperty("--particle-color", color);
      particle.style.setProperty("--particle-size", `${size}px`);
      particle.style.setProperty("--drift-x", `${drift}px`);
      particle.style.setProperty("--rise", `${rise}px`);

      document.body.appendChild(particle);

      particle.addEventListener("animationend", () => {
        particle.remove();
        particleCount = Math.max(0, particleCount - 1);
      }, { once: true });
    }, { passive: true });
  }

})();
