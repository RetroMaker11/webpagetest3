const FOLDER_ID = '1Yhq7F7h82Y3D5v2FsOOahxWg8pzH9ZLd';
const API_KEY = 'AIzaSyCC0SvC3CQiDFStxQq0efuQvXFOILoAocs';

const imageGallery = document.getElementById('image-gallery');
const backgroundMusic = document.getElementById('background-music');
const playMusicBtn = document.getElementById('play-music');
const miniWindow = document.createElement('div');
miniWindow.id = 'mini-window';
document.body.appendChild(miniWindow);

const searchIcon = document.getElementById('search-icon');
const searchInput = document.getElementById('search-input');
const backButton = document.getElementById('back-button');
const muteButton = document.getElementById('mute-button');
let allMedia = [];
let isSearchActive = false;
let isMuted = false;

function loadGoogleDriveAPI() {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
        gapi.load('client', initClient);
    };
    document.body.appendChild(script);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    }).then(loadMedia).catch(console.error);
}

function loadMedia() {
    gapi.client.drive.files.list({
        q: `'${FOLDER_ID}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`,
        fields: 'files(id, name, webContentLink, mimeType)',
        orderBy: 'name'
    }).then(response => {
        const files = response.result.files;
        if (files && files.length > 0) {
            allMedia = files;
            displayMedia(allMedia);
        }
    }).catch(console.error);
}

function displayMedia(media) {
    imageGallery.innerHTML = '';
    if (media.length === 0) {
        imageGallery.innerHTML = '<p id="no-results">No se han encontrado resultados</p>';
        return;
    }
    media.forEach((file, index) => {
        const mediaItem = createMediaItem(file, index);
        imageGallery.appendChild(mediaItem);
    });
}

function createMediaItem(file, index) {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'image-item';
    
    const directLink = file.webContentLink.replace('&export=download', '');
    const thumbnailLink = `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`;
    
    if (file.mimeType.startsWith('image/')) {
        mediaItem.innerHTML = `
            <img src="${thumbnailLink}" alt="${file.name}" loading="lazy" data-full-img="${directLink}">
        `;
    } else if (file.mimeType.startsWith('video/')) {
        mediaItem.innerHTML = `
            <video src="${directLink}" poster="${thumbnailLink}" preload="metadata" muted></video>
        `;
    }
    
    mediaItem.querySelector('img, video').addEventListener('click', () => openMiniWindow(directLink, file.name, file.id, file.mimeType));
    
    return mediaItem;
}

function openMiniWindow(mediaUrl, caption, fileId, mimeType) {
    let mediaContent;
    if (mimeType.startsWith('image/')) {
        mediaContent = `<img src="${mediaUrl}" alt="${caption}" style="max-width: 100%; height: auto;">`;
    } else if (mimeType.startsWith('video/')) {
        mediaContent = `<video src="${mediaUrl}" controls muted style="max-width: 100%; height: auto;"></video>`;
    }

    miniWindow.innerHTML = `
        <div class="mini-window-content">
            ${mediaContent}
            <p>${caption}</p>
            <a href="${mediaUrl}" target="_blank" rel="noopener noreferrer">Abrir y Descargar</a>
            <button onclick="closeMiniWindow()">Cerrar</button>
        </div>
    `;
    miniWindow.style.display = 'block';
}

function closeMiniWindow() {
    miniWindow.style.display = 'none';
}

function playMusic() {
    if (!isMuted) {
        backgroundMusic.volume = 0.3;
        backgroundMusic.play().then(() => {
            console.log('La música comenzó a reproducirse');
            playMusicBtn.style.display = 'none';
        }).catch((error) => {
            console.error('No se pudo reproducir la música automáticamente:', error);
            playMusicBtn.style.display = 'block';
        });
    }
}

function performSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredMedia = allMedia.filter(file => 
        file.name.toLowerCase().includes(searchTerm)
    );
    displayMedia(filteredMedia);
    isSearchActive = true;
    backButton.style.display = 'block';
    history.pushState({ searchTerm }, '', `?search=${encodeURIComponent(searchTerm)}`);
}

function resetSearch() {
    searchInput.value = '';
    displayMedia(allMedia);
    isSearchActive = false;
    backButton.style.display = 'none';
    history.pushState(null, '', window.location.pathname);
}

function toggleMute() {
    if (isMuted) {
        backgroundMusic.play();
        muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
        backgroundMusic.pause();
        muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
    isMuted = !isMuted;
}

document.body.addEventListener('click', playMusic, { once: true });
document.body.addEventListener('touchstart', playMusic, { once: true });
document.body.addEventListener('keydown', playMusic, { once: true });

window.addEventListener('load', () => {
    playMusic();
    playMusicBtn.addEventListener('click', playMusic);
    loadGoogleDriveAPI();
    
    searchIcon.addEventListener('click', () => {
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        } else {
            resetSearch();
        }
    });

    searchInput.addEventListener('input', performSearch);
    backButton.addEventListener('click', resetSearch);
    muteButton.addEventListener('click', toggleMute);
});

window.addEventListener('focus', playMusic);

// Handle browser's back button
window.addEventListener('popstate', function(event) {
    if (isSearchActive) {
        resetSearch();
    }
});
