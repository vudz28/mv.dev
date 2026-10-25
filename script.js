
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
})();
