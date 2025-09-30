// Single Audio Engine for Both Players
let audioEngine = new Audio();
let isPlaying = false;
let isLooping = false;
let currentBase64 = null;
let currentTrack = null;
let currentPlayer = null;

// Device Selection Functions
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

// Initialize Player with Prefix
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
        if (elements.volumeValue) {
            elements.volumeValue.textContent = e.target.value + '%';
        }
    });

    audioEngine.addEventListener('loadeddata', updateDuration);
    audioEngine.addEventListener('timeupdate', updateProgress);
    audioEngine.addEventListener('ended', handleTrackEnd);
    audioEngine.addEventListener('error', handleError);

    audioEngine.volume = 0.7;
    updateVolumeSliderFill(70);
    if (elements.volumeValue) {
        elements.volumeValue.textContent = '70%';
    }

    window.playerElements = elements;
}

// Slider Fill Functions
function updateProgressSliderFill(progress) {
    if (!window.playerElements) return;
    const fillColor = '#1a1a1a';
    const trackColor = 'rgba(0, 0, 0, 0.1)';
    window.playerElements.progress.style.background =
        `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${progress}%, ${trackColor} ${progress}%, ${trackColor} 100%)`;
}

function updateVolumeSliderFill(volume) {
    if (!window.playerElements) return;
    const fillColor = '#1a1a1a';
    const trackColor = 'rgba(0, 0, 0, 0.1)';
    window.playerElements.volume.style.background =
        `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${volume}%, ${trackColor} ${volume}%, ${trackColor} 100%)`;
}

// Player Functions
function togglePlay() {
    if (!audioEngine.src) {
        console.warn('No audio source loaded');
        return;
    }
    if (!isPlaying) {
        audioEngine.play().then(() => {
            isPlaying = true;
            window.playerElements.playPause.innerHTML = '<i class="fa fa-pause"></i>';
            window.playerElements.cover.classList.add('playing');
            animateVisualizer();
        }).catch(e => console.error('Play error:', e));
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
    if (!currentBase64) {
        alert('No audio loaded to download');
        return;
    }
    try {
        const base64Data = currentBase64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = currentTrack?.title ? `${currentTrack.title}.mp3` : 'audio.mp3';
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading audio:', error);
        alert('Error downloading audio file');
    }
}

function seekTo(percent) {
    if (audioEngine.duration) {
        audioEngine.currentTime = (percent / 100) * audioEngine.duration;
    }
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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleTrackEnd() {
    if (!isLooping) {
        isPlaying = false;
        window.playerElements.playPause.innerHTML = '<i class="fa fa-play"></i>';
        window.playerElements.cover.classList.remove('playing');
    }
}

function handleError(error) {
    console.error('Audio player error:', error);
    if (window.playerElements) {
        window.playerElements.title.textContent = 'Error loading audio';
        window.playerElements.artist.textContent = 'Please check the audio format';
    }
}

function animateVisualizer() {
    const selector = currentPlayer === 'desktop' ? '.desktop-bar' : '.lofi-bar';
    const bars = document.querySelectorAll(selector);
    if (isPlaying && bars.length > 0) {
        bars.forEach(bar => {
            const height = Math.random() * 16 + 4;
            bar.style.height = `${height}px`;
        });
        setTimeout(animateVisualizer, 200);
    }
}

// Load Track Functions
function loadTrack(track) {
    currentTrack = track;
    if (window.playerElements) {
        window.playerElements.cover.src = track.cover || '';
        window.playerElements.title.textContent = track.title || 'Unknown Track';
        window.playerElements.artist.textContent = track.artist || 'Unknown Artist';
    }
    if (track.dataURL) {
        loadDataURL(track.dataURL);
    } else if (track.base64) {
        loadBase64Audio(track.base64, track.format || 'mp3');
    } else if (track.src) {
        audioEngine.src = track.src;
    }
}

function loadDataURL(dataURL) {
    try {
        if (!dataURL.startsWith('data:audio/')) throw new Error('Invalid data URL format');
        currentBase64 = dataURL;
        audioEngine.src = dataURL;
        console.log('Audio loaded successfully');
    } catch (error) {
        console.error('Error loading audio:', error);
    }
}

function loadBase64Audio(base64Data, format = 'mp3') {
    try {
        let audioData = base64Data;
        if (audioData.includes(',')) {
            audioData = audioData.split(',')[1];
        }
        const dataURL = `data:audio/${format};base64,${audioData}`;
        loadDataURL(dataURL);
    } catch (error) {
        console.error('Error loading base64 audio:', error);
    }
}

// Load Base64 from GitHub
async function loadTrackFromGithub(url, trackInfo) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch track');
        const base64Data = await response.text();
        const dataURL = `data:audio/mp3;base64,${base64Data.trim()}`;
        currentBase64 = dataURL;
        audioEngine.src = dataURL;
        currentTrack = trackInfo;

        if (window.playerElements) {
            window.playerElements.cover.src = trackInfo.cover || '';
            window.playerElements.title.textContent = trackInfo.title || 'Unknown Title';
            window.playerElements.artist.textContent = trackInfo.artist || 'Unknown Artist';
        }

        console.log("Track loaded successfully from GitHub:", trackInfo.title);
    } catch (err) {
        console.error("Error loading track:", err);
        if (window.playerElements) {
            window.playerElements.title.textContent = 'Error loading track';
            window.playerElements.artist.textContent = 'Try again';
        }
    }
}

// Global Functions (for backward compatibility)
function loadDataURLGlobal(title, artist, cover, dataURL) {
    loadTrack({ title, artist, cover, dataURL });
}

function loadAudio(dataURL) { 
    loadDataURL(dataURL); 
}

// Initialize Player on Load
function initializeMusicPlayer() {
    checkDevicePreference();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMusicPlayer);
} else {
    initializeMusicPlayer();
}
