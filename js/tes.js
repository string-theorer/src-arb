// ========================
// Global Audio Engine
// ========================
let audioEngine = new Audio();
let isPlaying = false;
let isLooping = false;
let currentBase64 = null;
let currentTrack = null;
let currentPlayer = null;

// ========================
// Device Selection
// ========================
function selectDevice(deviceType) {
    localStorage.setItem('preferredDevice', deviceType);
    const popup = document.getElementById('devicePopup');
    popup.classList.add('hidden');
    setTimeout(() => {
        popup.classList.remove('show');
        showPlayer(deviceType);
    }, 300);
}

function showPlayer(deviceType) {
    if (deviceType === 'desktop') {
        document.getElementById('desktopPlayer').style.display = 'block';
        document.getElementById('mobilePlayer').style.display = 'none';
        currentPlayer = 'desktop';
        initializePlayer('desktop-');
    } else {
        document.getElementById('mobilePlayer').style.display = 'flex';
        document.getElementById('desktopPlayer').style.display = 'none';
        currentPlayer = 'mobile';
        initializePlayer('mobile-');
    }
}

function checkDevicePreference() {
    const savedDevice = localStorage.getItem('preferredDevice');
    if (savedDevice) {
        showPlayer(savedDevice);
    } else {
        setTimeout(() => {
            const popup = document.getElementById('devicePopup');
            popup.classList.add('show');
        }, 100);
    }
}

// ========================
// Player Initialization
// ========================
function initializePlayer(prefix) {
    const elements = {
        cover: document.getElementById(prefix + 'cover'),
        title: document.getElementById(prefix + 'title'),
        artist: document.getElementById(prefix + 'artist'),
        playPause: document.getElementById(prefix + 'play-pause'),
        loop: document.getElementById(prefix + 'loop'),
        download: document.getElementById(prefix + 'download'),
        progress: document.getElementById(prefix + 'progress'),
        currentTime: document.getElementById(prefix + 'current'),
        duration: document.getElementById(prefix + 'duration'),
        volume: document.getElementById(prefix + 'volume'),
        volumeValue: document.getElementById(prefix + 'volume-value')
    };

    elements.playPause.addEventListener('click', togglePlay);
    elements.loop.addEventListener('click', toggleLoop);
    elements.download.addEventListener('click', downloadAudio);
    elements.progress.addEventListener('input', (e) => seekTo(e.target.value));
    elements.volume.addEventListener('input', (e) => {
        setVolume(e.target.value);
        updateVolumeSliderFill(e.target.value);
        if (elements.volumeValue) elements.volumeValue.textContent = e.target.value + '%';
    });

    audioEngine.addEventListener('loadeddata', updateDuration);
    audioEngine.addEventListener('timeupdate', updateProgress);
    audioEngine.addEventListener('ended', handleTrackEnd);
    audioEngine.addEventListener('error', handleError);

    audioEngine.volume = 0.7;
    updateVolumeSliderFill(70);
    if (elements.volumeValue) elements.volumeValue.textContent = '70%';

    window.playerElements = elements;
}

// ========================
// Slider Fill
// ========================
function updateProgressSliderFill(progress) {
    if (!window.playerElements) return;
    const fillColor = '#1a1a1a';
    const trackColor = 'rgba(0,0,0,0.1)';
    window.playerElements.progress.style.background =
        `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${progress}%, ${trackColor} ${progress}%, ${trackColor} 100%)`;
}

function updateVolumeSliderFill(volume) {
    if (!window.playerElements) return;
    const fillColor = '#1a1a1a';
    const trackColor = 'rgba(0,0,0,0.1)';
    window.playerElements.volume.style.background =
        `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${volume}%, ${trackColor} ${volume}%, ${trackColor} 100%)`;
}

// ========================
// Player Controls
// ========================
function togglePlay() {
    if (!audioEngine.src) return console.warn('No audio loaded');
    if (!isPlaying) {
        audioEngine.play().then(() => {
            isPlaying = true;
            window.playerElements.playPause.innerHTML = '<i class="fa fa-pause"></i>';
            window.playerElements.cover.classList.add('playing');
            animateVisualizer();
        }).catch(e => console.error(e));
    } else {
        audioEngine.pause();
        isPlaying = false;
        window.playerElements.playPause.innerHTML = '<i class="fa fa-play"></i>';
        window.playerElements.cover.classList.remove('playing');
    }
}

function toggleLoop() {
    isLooping = !isLooping;
    audioEngine.loop = isLooping;
    window.playerElements.loop.classList.toggle('active', isLooping);
}

function downloadAudio() {
    if (!currentBase64) return alert('No audio loaded');
    const base64Data = currentBase64.split(',')[1];
    const byteArray = new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0)));
    const blob = new Blob([byteArray], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentTrack?.title ? `${currentTrack.title}.mp3` : 'audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function seekTo(percent) {
    if (audioEngine.duration) audioEngine.currentTime = (percent / 100) * audioEngine.duration;
}

function setVolume(value) {
    audioEngine.volume = value / 100;
}

function updateProgress() {
    if (!audioEngine.duration || !window.playerElements) return;
    const progress = (audioEngine.currentTime / audioEngine.duration) * 100;
    window.playerElements.progress.value = progress;
    window.playerElements.currentTime.textContent = formatTime(audioEngine.currentTime);
    updateProgressSliderFill(progress);
}

function updateDuration() {
    if (!window.playerElements) return;
    window.playerElements.duration.textContent = formatTime(audioEngine.duration || 0);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2,'0')}`;
}

function handleTrackEnd() {
    if (!isLooping) {
        isPlaying = false;
        window.playerElements.playPause.innerHTML = '<i class="fa fa-play"></i>';
        window.playerElements.cover.classList.remove('playing');
    }
}

function handleError() {
    if (window.playerElements) {
        window.playerElements.title.textContent = 'Error loading audio';
        window.playerElements.artist.textContent = 'Please check the file';
    }
}

function animateVisualizer() {
    const bars = document.querySelectorAll(currentPlayer === 'desktop' ? '.desktop-bar' : '.lofi-bar');
    if (isPlaying && bars.length) {
        bars.forEach(bar => bar.style.height = `${Math.random()*16+4}px`);
        setTimeout(animateVisualizer, 200);
    }
}

// ========================
// Track Loading
// ========================
function loadTrack(track) {
    currentTrack = track;
    if (window.playerElements) {
        window.playerElements.cover.src = track.cover || '';
        window.playerElements.title.textContent = track.title || 'Unknown Track';
        window.playerElements.artist.textContent = track.artist || 'Unknown Artist';
    }
    if (track.dataURL) loadDataURL(track.dataURL);
    else if (track.base64) loadBase64Audio(track.base64);
    else if (track.src) audioEngine.src = track.src;
}

function loadDataURL(dataURL) {
    currentBase64 = dataURL;
    audioEngine.src = dataURL;
}

function loadBase64Audio(base64Data, format='mp3') {
    const dataURL = `data:audio/${format};base64,${base64Data.includes(',')?base64Data.split(',')[1]:base64Data}`;
    loadDataURL(dataURL);
}

async function loadTrackFromGithub(url, trackInfo) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Fetch failed');
        const base64Data = await res.text();
        const dataURL = `data:audio/mp3;base64,${base64Data.trim()}`;
        currentBase64 = dataURL;
        audioEngine.src = dataURL;
        currentTrack = trackInfo;
        if (window.playerElements) {
            window.playerElements.cover.src = trackInfo.cover || '';
            window.playerElements.title.textContent = trackInfo.title || 'Unknown Title';
            window.playerElements.artist.textContent = trackInfo.artist || 'Unknown Artist';
        }
    } catch(err) {
        console.error(err);
        if (window.playerElements) {
            window.playerElements.title.textContent = 'Error loading track';
            window.playerElements.artist.textContent = 'Try again';
        }
    }
}

// ========================
// Global Shortcut
// ========================
function loadDataURLGlobal(title, artist, cover, dataURL) {
    loadTrack({ title, artist, cover, dataURL });
}
function loadAudio(dataURL){ loadDataURL(dataURL); }

// ========================
// Init
// ========================
document.addEventListener('DOMContentLoaded', checkDevicePreference);
