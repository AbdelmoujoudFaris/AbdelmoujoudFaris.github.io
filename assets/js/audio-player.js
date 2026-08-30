/* Sequential background-audio playlist with a floating play/pause control.
   Self-contained: does not touch any other script or global on the page. */
(function () {
  "use strict";

  var container = document.getElementById("bg-audio-player");
  var toggleBtn = document.getElementById("bg-audio-toggle");
  if (!container || !toggleBtn) return;

  var basePath = container.getAttribute("data-base-path") || "";
  var trackNames = ["sound.mp3", "sound1.mp3", "sound2.mp3", "sound3.mp3"];
  var tracks = trackNames.map(function (name) {
    return basePath + "/assets/audio/" + name;
  });

  var audio = new Audio();
  audio.preload = "auto";
  audio.loop = false;
  audio.autoplay = true;

  var currentIndex = 0;
  audio.src = tracks[currentIndex];

  function loadTrack(index, autoplay) {
    currentIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    audio.src = tracks[currentIndex];
    if (autoplay) {
      audio.play().catch(function () {});
    }
  }

  audio.addEventListener("ended", function () {
    loadTrack(currentIndex + 1, true);
  });

  function updateUI(isPlaying) {
    toggleBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    toggleBtn.setAttribute(
      "aria-label",
      isPlaying ? "Pause background audio" : "Play background audio"
    );
  }

  audio.addEventListener("play", function () {
    updateUI(true);
  });
  audio.addEventListener("pause", function () {
    updateUI(false);
  });

  toggleBtn.addEventListener("click", function () {
    if (audio.paused) {
      audio.play().catch(function () {});
    } else {
      audio.pause();
    }
  });

  function tryAutoplay() {
    var playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        var resumeOnInteraction = function () {
          audio.play().catch(function () {});
        };
        document.addEventListener("click", resumeOnInteraction, { once: true });
        document.addEventListener("keydown", resumeOnInteraction, { once: true });
        document.addEventListener("touchstart", resumeOnInteraction, { once: true });
      });
    }
  }

  updateUI(false);
  tryAutoplay();
})();
