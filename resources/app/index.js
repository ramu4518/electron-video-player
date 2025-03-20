
const videoPlayer = document.getElementById("videoPlayer");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const imagePlaceholder = document.getElementById("imagePlaceholder");

const playPauseBtn = document.getElementById("playPauseBtn");
const playPauseIcon = document.getElementById("playPauseIcon");

const progressBar = document.getElementById("progressBar");
const volumeBtn = document.getElementById("volumeBtn");
const volumeControl = document.getElementById("volumeControl");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const skipBackBtn = document.getElementById("skipBackBtn");
const skipForwardBtn = document.getElementById("skipForwardBtn");
const timeDisplay = document.getElementById("timeDisplay");

function togglePlayPause() {
    if (videoPlayer.paused) {
        videoPlayer.play();
        playPauseBtn.classList.remove("play");
        playPauseBtn.classList.add("pause");
    } else {
        videoPlayer.pause();
        playPauseBtn.classList.remove("pause");
        playPauseBtn.classList.add("play");
    }
}

// Play/Pause Toggle
playPauseBtn.addEventListener("click", togglePlayPause);
videoPlayer.addEventListener("click", togglePlayPause);

// Function to update progress bar style
function updateProgressBarStyle() {
    let percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressBar.style.background = `linear-gradient(to right,darkblue ${percent}%, #ddd ${percent}%)`;
}

// Update Progress Bar & Time Display
videoPlayer.addEventListener("timeupdate", () => {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressBar.value = progress;

    // Update time display
    const currentTime = formatTime(videoPlayer.currentTime);
    const duration = formatTime(videoPlayer.duration);
    timeDisplay.textContent = `${currentTime} / ${duration}`;

    // Apply custom styling to progress bar
    updateProgressBarStyle();
});

// Seek in Video
progressBar.addEventListener("input", () => {
    const seekTime = (progressBar.value / 100) * videoPlayer.duration;
    videoPlayer.currentTime = seekTime;

    // Apply custom styling to progress bar
    updateProgressBarStyle();
});

// Function to update volume icon
function updateVolumeIcon(volume) {
    if (volume == 0) {
        volumeBtn.innerHTML = "&#128263;"; // Mute
    } else if (volume > 0 && volume <= 0.40) {
        volumeBtn.innerHTML = "&#128265;"; // Low Volume
    } else {
        volumeBtn.innerHTML = "&#128266;"; // High Volume
    }
}

// Function to update modern volume bar
function updateVolumeBar() {
    let percent = videoPlayer.volume * 100;
    volumeControl.style.background = `linear-gradient(to right, darkblue ${percent}%, #ddd ${percent}%)`;
}

// Volume Control Event
volumeControl.addEventListener("input", () => {
    // Clamp volume between 0 and 1
    videoPlayer.volume = Math.min(1, Math.max(0, volumeControl.value));
    updateVolumeBar();
    updateVolumeIcon(videoPlayer.volume);
});

// Initialize Icon & Volume Bar on Load
updateVolumeIcon(videoPlayer.volume);
updateVolumeBar();

// Fullscreen Toggle
fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        videoPlayer.requestFullscreen();
        // Consider using a better user feedback mechanism instead of alert
    } else {
        document.exitFullscreen();
    }
});

// Skip Forward & Backward
skipBackBtn.addEventListener("click", () => {
    videoPlayer.currentTime -= 10;
});
skipForwardBtn.addEventListener("click", () => {
    videoPlayer.currentTime += 10;
});

// Picture-in-Picture Mode
videoPlayer.addEventListener("dblclick", () => {
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
    } else {
        videoPlayer.requestPictureInPicture();
    }
});

// Format Time
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

window.electron.onVideoSelected((filePath) => {
    console.log("Selected Video:", filePath);

    if (filePath) {
        const fileName = filePath.split("\\").pop().split("/").pop(); // Extract file name

        document.title = `Asura Video Player - ${fileName}`; // Set title dynamically

        imagePlaceholder.style.display = "none";
        videoPlayer.style.display = "block";
        videoPlayer.src = filePath;

        // Check if audio track is available
        if (videoPlayer.audioTracks && videoPlayer.audioTracks.length > 0) {
            console.log("Audio track is available.");
        } else {
            console.warn("No audio track found.");
        }

        // Log the current volume level
        console.log("Current volume level:", videoPlayer.volume);


        // Set volume to the control value
        videoPlayer.volume = Math.min(1, Math.max(0, volumeControl.value));


        // Error handling for video playback
        videoPlayer.play().catch(error => {
            console.error("Error playing video:", error);
        });

    }
});

// Keyboard Controls
document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowRight":
            videoPlayer.currentTime += 10;
            break;
        case "ArrowLeft":
            videoPlayer.currentTime -= 10;
            break;
        case " ":
            event.preventDefault();
            togglePlayPause();
            break;
        case "ArrowUp":
            event.preventDefault();
            videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
            volumeControl.value = videoPlayer.volume;
            updateVolumeBar();
            updateVolumeIcon(videoPlayer.volume);
            break;
        case "ArrowDown":
            event.preventDefault();
            videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
            volumeControl.value = videoPlayer.volume;
            updateVolumeBar();
            updateVolumeIcon(videoPlayer.volume);
            break;
    }
});

const fs = require('fs');
const path = require('path');

// Function to convert SRT to VTT
function convertSRTtoVTT(srtData) {
    console.log("Converting SRT to VTT...");
    return "WEBVTT\n\n" + srtData
        .replace(/\r/g, '') // Remove carriage returns
        .replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2'); // Convert timestamp format
}

// Function to load subtitles from the same directory as the video
function loadSubtitles(videoPath) {
    console.log("Loading subtitles for:", videoPath);
    
    if (videoPath) {
        const videoDir = path.dirname(videoPath);
        const videoName = path.basename(videoPath, path.extname(videoPath));
        const files = fs.readdirSync(videoDir);
        
        let subtitleTracks = [];

        files.forEach(file => {
            if (file.endsWith('.srt')) {
                console.log("Found subtitle file:", file);

                const subtitlePath = path.join(videoDir, file);
                const subtitleLang = file.replace(videoName, '').replace('.srt', '').replace(/[_-]/g, ' ').trim() || 'Unknown';
                const srtData = fs.readFileSync(subtitlePath, 'utf8');
                const vttData = convertSRTtoVTT(srtData);

                // Create a Blob URL for the VTT data
                const vttBlob = new Blob([vttData], { type: 'text/vtt' });
                const vttURL = URL.createObjectURL(vttBlob);

                // Add subtitle track to the video
                const trackElement = document.createElement("track");
                trackElement.kind = "subtitles";
                trackElement.label = subtitleLang;
                trackElement.src = vttURL;
                trackElement.default = subtitleTracks.length === 0; // First track as default
                videoPlayer.appendChild(trackElement);

                console.log("Added subtitle:", subtitleLang);

                subtitleTracks.push({ label: subtitleLang, mode: "showing" });
            }
        });

        // Ensure subtitles are enabled
        setTimeout(() => {
            const tracks = videoPlayer.textTracks;
            if (tracks.length > 0) {
                console.log("Enabling first subtitle track...");
                tracks[0].mode = "showing";
            }
        }, 1000);

        // Send subtitle tracks to menu
        window.electron.send("update-subtitle-menu", subtitleTracks);
    }
}

const audioTrackSelect = document.getElementById("audioTrackSelect");
const subtitleSelect = document.getElementById("subtitleSelect");

// Load video and auto-detect tracks
window.electron.onVideoSelected((filePath) => {
    console.log("Selected Video:", filePath);
    document.title = `Asura Video Player - ${path.basename(filePath)}`;

    imagePlaceholder.style.display = "none";
    videoPlayer.style.display = "block";
    videoPlayer.src = filePath;
    videoPlayer.play();

        // Load audio tracks
        loadAudioTracks();
        
        // Log available audio tracks
        console.log("Available audio tracks:", videoPlayer.audioTracks);


    // Load subtitles from the same directory
    loadSubtitles(filePath);
});

// Function to load audio tracks
function loadAudioTracks() {
    if (videoPlayer.audioTracks) {
        for (let i = 0; i < videoPlayer.audioTracks.length; i++) {
            const track = videoPlayer.audioTracks[i];
            const option = document.createElement("option");
            option.value = i;
            option.textContent = track.label || `Track ${i + 1}`;
            audioTrackSelect.appendChild(option);
        }

        audioTrackSelect.addEventListener("change", () => {
            const selectedTrackIndex = audioTrackSelect.value;
            for (let j = 0; j < videoPlayer.audioTracks.length; j++) {
                videoPlayer.audioTracks[j].enabled = (j == selectedTrackIndex);
            }
        });
    }
}


// Handle disabling subtitles
window.electron.onDisableSubtitles(() => {
    console.log("Disabling all subtitles...");
    videoPlayer.textTracks.forEach(track => track.mode = "disabled");
});
