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
const favoritesButton = document.getElementById('favorites-button');
const favoritesSection = document.getElementById('favorites-section');
const favoritesGrid = document.getElementById('favorites-grid');

let allMedia = [];
let isSearchActive = false;
let isMuted = false;

function loadGoogleDriveAPI() {
    gapi.load('client', initClient);
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
        orderBy: 'name',
        pageSize: 320
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
    lazyLoadMedia();
    addFavoriteIcons();
}

function createMediaItem(file, index) {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'image-item';
    
    const thumbnailLink = `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`;
    
    if (file.mimeType.startsWith('image/')) {
        mediaItem.innerHTML = `
            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${thumbnailLink}" alt="${file.name}" loading="lazy" data-file-id="${file.id}">
        `;
    } else if (file.mimeType.startsWith('video/')) {
        
        mediaItem.innerHTML = `
            <video data-poster="${thumbnailLink}" preload="none" muted data-file-id="${file.id}"></video>
        `;
    }
    
    mediaItem.querySelector('img, video').addEventListener('click', () => openMiniWindow(file.id, file.name, file.mimeType));
    
    return mediaItem;
}

function lazyLoadMedia() {
    const mediaItems = document.querySelectorAll('img[data-src], video[data-poster]');
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const mediaItem = entry.target;
                if (mediaItem.tagName === 'IMG') {
                    mediaItem.src = mediaItem.dataset.src;
                } else if (mediaItem.tagName === 'VIDEO') {
                    mediaItem.poster = mediaItem.dataset.poster;
                }
                observer.unobserve(mediaItem);
            }
        });
    }, options);

    mediaItems.forEach(item => observer.observe(item));
}

function openMiniWindow(fileId, caption, mimeType) {
    let mediaContent;
    if (mimeType.startsWith('image/')) {
        mediaContent = `<iframe src="https://drive.google.com/file/d/${fileId}/preview" width="640" height="480" allow="autoplay" allowfullscreen></iframe>`;
    } else if (mimeType.startsWith('video/')) {
        mediaContent = `<iframe src="https://drive.google.com/file/d/${fileId}/preview" width="640" height="480" allow="autoplay" allowfullscreen></iframe>`;
    }

    miniWindow.innerHTML = `
        <div class="mini-window-content">
            ${mediaContent}
            <p>${caption}</p>
            <a href="https://drive.google.com/uc?export=download&id=${fileId}" target="_blank" rel="noopener noreferrer">Descargar</a>
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

function addFavoriteIcons() {
    const mediaItems = document.querySelectorAll('.image-item');
    mediaItems.forEach(item => {
        if (!item.querySelector('.favorite-icon')) {
            const favoriteIcon = document.createElement('i');
            favoriteIcon.className = 'fas fa-star favorite-icon';
            favoriteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(item);
            });
            item.appendChild(favoriteIcon);
        }
    });
    updateFavoriteIcons();
}

function toggleFavorite(item) {
    const icon = item.querySelector('.favorite-icon');
    icon.classList.toggle('active');
    updateFavorites(item);
}

function updateFavorites(item) {
    const fileId = item.querySelector('img, video').dataset.fileId;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (item.querySelector('.favorite-icon.active')) {
        if (!favorites.includes(fileId)) {
            favorites.push(fileId);
        }
    } else {
        favorites = favorites.filter(id => id !== fileId);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function updateFavoriteIcons() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    document.querySelectorAll('.image-item').forEach(item => {
        const fileId = item.querySelector('img, video').dataset.fileId;
        const icon = item.querySelector('.favorite-icon');
        if (favorites.includes(fileId)) {
            icon.classList.add('active');
        } else {
            icon.classList.remove('active');
        }
    });
}

function showFavorites() {
    favoritesGrid.innerHTML = '';
    
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoriteItems = allMedia.filter(file => favorites.includes(file.id));
    
    favoriteItems.forEach(file => {
        const mediaItem = createMediaItem(file);
        favoritesGrid.appendChild(mediaItem);
    });
    
    addFavoriteIcons();
    favoritesSection.style.display = 'block';
    backButton.style.display = 'block';
}

function hideFavorites() {
    favoritesSection.style.display = 'none';
    backButton.style.display = 'none';
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
    backButton.addEventListener('click', () => {
        if (favoritesSection.style.display === 'block') {
            hideFavorites();
        } else {
            resetSearch();
        }
    });
    muteButton.addEventListener('click', toggleMute);
    favoritesButton.addEventListener('click', showFavorites);
});

window.addEventListener('focus', playMusic);

window.addEventListener('popstate', function(event) {
    if (isSearchActive) {
        resetSearch();
    }
});
