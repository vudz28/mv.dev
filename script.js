
(() => {
  "use strict";

  const config = window.CONFIG || {};
  const $ = (id) => document.getElementById(id);

  function setText(id, value) {
    const el = $(id);
    if (el && value !== undefined && value !== null && value !== "") {
      el.textContent = value;
    }
  }

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
    if (!image) return;

    const validUrl = safeUrl(url);
    if (!validUrl) {
      image.style.display = "none";
      return;
    }

    image.onerror = () => {
      image.style.display = "none";
    };

    image.onload = () => {
      image.style.display = "";
    };

    image.src = validUrl;
  }

  // Background image or animated video
  function setBackground(url) {
    const bg = $("background");
    const validUrl = safeUrl(url);

    if (!bg || !validUrl) return;

    if (/\.(mp4|webm)(?:$|[?#])/i.test(validUrl)) {
      const video = document.createElement("video");
      video.src = validUrl;
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

      bg.replaceChildren(video);
      video.play().catch(() => {});
    } else {
      bg.style.backgroundImage =
        `url("${validUrl.replace(/["\\\n\r]/g, "")}")`;
    }
  }

  // Profile information
  setText("displayName", config.displayName);
  setText("handle", config.handle);
  setText("bio", config.bio);
  setText("musicTitle", config.musicTitle || "Now Playing");
  setText("musicArtist", config.musicArtist || "No track detected");

  setImage("bannerImage", config.bannerUrl);
  setImage("musicCover", config.musicCoverUrl);
  setBackground(config.backgroundUrl);

  // Social links
  [
    ["discordLink", config.discordUrl],
    ["instagramLink", config.instagramUrl],
    ["facebookLink", config.facebookUrl]
  ].forEach(([id, url]) => {
    const link = $(id);
    if (!link) return;

    const validUrl = safeUrl(url);
    if (validUrl) {
      link.href = validUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } else {
      link.hidden = true;
    }
  });

  // Default Discord avatar
  const fallbackAvatar =
    "https://cdn.discordapp.com/embed/avatars/0.png";

  setImage("avatar", fallbackAvatar);

  // Discord presence via Lanyard
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

      if (!response.ok) throw new Error("Discord API unavailable");

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error("No Discord data");
      }

      const data = result.data;
      const user = data.discord_user;

      if (user) {
        const avatarUrl = user.avatar
          ? `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "webp"}?size=256`
          : fallbackAvatar;

        setImage("avatar", avatarUrl);
      }

      // Badges
      const badges = $("badges");
      if (badges) {
        badges.replaceChildren();

        const discordBadge = document.createElement("span");
        discordBadge.className = "badge discord-badge";
        discordBadge.textContent = "✦ Discord";
        badges.appendChild(discordBadge);

        const flags = Number(user?.public_flags || 0);
        const badgeNames = [];

        if (flags & (1 << 0)) badgeNames.push("Staff");
        if (flags & (1 << 1)) badgeNames.push("Partner");
        if (flags & (1 << 2)) badgeNames.push("HypeSquad");
        if (flags & (1 << 17)) badgeNames.push("Active Developer");

        badgeNames.forEach((name) => {
          const badge = document.createElement("span");
          badge.className = "badge discord-badge";
          badge.textContent = name;
          badges.appendChild(badge);
        });
      }

      // Discord status
      const status = data.discord_status || "offline";
      const statusLabels = {
        online: "ONLINE ON DISCORD",
        idle: "IDLE ON DISCORD",
        dnd: "DO NOT DISTURB",
        offline: "OFFLINE ON DISCORD"
      };

      setText("discordStatus", statusLabels[status] || "OFFLINE ON DISCORD");
      setText("activityText", "DISCORD STATUS");

      // Current activity
      const activities = data.activities || [];
      const activity = activities.find((item) => item.type !== 4);
      const activityBox = $("discordActivity");

      if (activity && activityBox) {
        activityBox.hidden = false;
        setText("activityName", activity.name || "Playing");
        setText(
          "activityDetails",
          activity.details || activity.state || ""
        );
      } else if (activityBox) {
        activityBox.hidden = true;
      }

      // Spotify Now Playing
      if (data.spotify) {
        setText("musicTitle", data.spotify.song);
        setText("musicArtist", data.spotify.artist);
        setImage("musicCover", data.spotify.album_art_url);
      }
    } catch (error) {
      console.warn("Discord data could not be loaded:", error);
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

    let started = false;

    const startMusic = () => {
      if (started) return;

      audio.play().then(() => {
        started = true;
        document.removeEventListener("pointerdown", startMusic);
        document.removeEventListener("keydown", startMusic);
      }).catch(() => {});
    };

    startMusic();
    document.addEventListener("pointerdown", startMusic);
    document.addEventListener("keydown", startMusic);
  }

  // Mouse particle effect
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const touchDevice = window.matchMedia("(hover: none)").matches;

  if (!reducedMotion && !touchDevice) {
    let lastParticleTime = 0;
    let particleCount = 0;

    document.addEventListener("pointermove", (event) => {
      const now = performance.now();

      if (now - lastParticleTime < 28 || particleCount >= 35) return;

      lastParticleTime = now;
      particleCount++;

      const particle = document.createElement("span");
      particle.className = "mouse-particle";

      const colors = ["#a18aff", "#7bc6ff", "#e0a8ff"];

      particle.style.left = `${event.clientX}px`;
      particle.style.top = `${event.clientY}px`;
      particle.style.setProperty(
        "--particle-color",
        colors[Math.floor(Math.random() * colors.length)]
      );
      particle.style.setProperty(
        "--particle-size",
        `${3 + Math.random() * 5}px`
      );
      particle.style.setProperty(
        "--drift-x",
        `${(Math.random() - 0.5) * 65}px`
      );
      particle.style.setProperty(
        "--rise",
        `${25 + Math.random() * 55}px`
      );

      document.body.appendChild(particle);

      particle.addEventListener("animationend", () => {
        particle.remove();
        particleCount = Math.max(0, particleCount - 1);
      }, { once: true });
    }, { passive: true });
  }

  // Start screen: reveal the existing website and attempt music playback
  const startScreen = $("startScreen");
  const startButton = $("startButton");
  const backgroundMusic = $("backgroundMusic");

  function startWebsite() {
    if (startScreen) {
      startScreen.classList.add("is-leaving");

      // Remove overlay after the transition finishes
      window.setTimeout(() => {
        startScreen.remove();
      }, 750);
    }

    if (backgroundMusic) {
      backgroundMusic.volume = 0.35;
      backgroundMusic.play().catch(() => {
        // Playback may fail if the audio URL is not a direct audio file.
      });
    }
  }

  if (startScreen) {
    startScreen.addEventListener("click", startWebsite, { once: true });
  }

  if (startButton) {
    startButton.addEventListener("click", (event) => {
      event.stopPropagation();
      startWebsite();
    }, { once: true });
  }  
})();
