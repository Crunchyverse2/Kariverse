let tracks = [];
let currentTrack = 0;
let audio = new Audio();
let isPlaying = false;

const trackArt = document.getElementById("track-art");
const trackTitle = document.getElementById("track-title");
const playPauseBtn = document.getElementById("play-pause");
const prevBtn = document.getElementById("prev-track");
const nextBtn = document.getElementById("next-track");
const canvas = document.getElementById("waveform-canvas");
const ctx = canvas.getContext("2d");

async function loadTracks() {
    const res = await fetch("tracks.json");
    tracks = await res.json();
    if (tracks.length > 0) {
        loadTrack(0);
    }
}

function loadTrack(index) {
    const track = tracks[index];
    audio.src = track.file;
    trackArt.src = track.art || "";
    trackTitle.textContent = track.title;
    drawWaveform(); // just clears for now, we'll add animation later
}

function playPause() {
    if (!isPlaying) {
        audio.play();
        isPlaying = true;
        playPauseBtn.textContent = "⏸️";
    } else {
        audio.pause();
        isPlaying = false;
        playPauseBtn.textContent = "▶️";
    }
}

function prevTrack() {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrack);
    if (isPlaying) audio.play();
}

function nextTrack() {
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
    if (isPlaying) audio.play();
}

function drawWaveform() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f0";
    for (let i = 0; i < canvas.width; i += 5) {
        let height = Math.random() * canvas.height;
        ctx.fillRect(i, (canvas.height - height) / 2, 3, height);
    }
}

playPauseBtn.addEventListener("click", playPause);
prevBtn.addEventListener("click", prevTrack);
nextBtn.addEventListener("click", nextTrack);

loadTracks();
