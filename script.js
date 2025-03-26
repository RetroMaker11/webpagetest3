console.log("Kawaii Wallpapers script loaded")
const FOLDER_ID = "1Yhq7F7h82Y3D5v2FsOOahxWg8pzH9ZLd"
const API_KEY = "AIzaSyCC0SvC3CQiDFStxQq0efuQvXFOILoAocs"

const imageGallery = document.getElementById("image-gallery")
const backgroundMusic = document.getElementById("background-music")
const playMusicBtn = document.getElementById("play-music")
const miniWindow = document.createElement("div")
miniWindow.id = "mini-window"
document.body.appendChild(miniWindow)

const searchIcon = document.getElementById("search-icon")
const searchInput = document.getElementById("search-input")
const searchButton = document.getElementById("search-button")
const searchBackButton = document.getElementById("search-back-button")
const searchSection = document.getElementById("search-section")
const searchResults = document.getElementById("search-results")
const backButton = document.getElementById("back-button")
const muteButton = document.getElementById("mute-button")
const favoritesButton = document.getElementById("favorites-button")
const changeMusicButton = document.getElementById("change-music-button")
const favoritesSection = document.getElementById("favorites-section")
const favoritesGrid = document.getElementById("favorites-grid")

let allMedia = []
const isSearchActive = false
let isMuted = false
let currentMusicIndex = 0

const musicTracks = [
  "https://www.cjoint.com/doc/24_10/NJjbyXchOLX_audio.mp3",
  "https://www.cjoint.com/doc/24_11/NKfcJMKZA2Z_audio2.mp3",
  "https://www.cjoint.com/doc/24_11/NKfcKVFD3AZ_audio3.mp3",
  "https://www.cjoint.com/doc/24_11/NKfcLwTTdtZ_audio4.mp3",
]

// Position floating shapes randomly
function positionFloatingShapes() {
  const shapes = document.querySelectorAll(".floating-shape")
  shapes.forEach((shape, index) => {
    const delay = -Math.random() * 20
    const duration = 15 + Math.random() * 10

    shape.style.left = `${Math.random() * 100}%`
    shape.style.top = `${Math.random() * 100}%`
    shape.style.animationDelay = `${delay}s`
    shape.style.animationDuration = `${duration}s`
  })
}

function loadGoogleDriveAPI() {
  console.log("Loading Google Drive API...")

  // Show loading indicator
  imageGallery.innerHTML =
    '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading wallpapers...</div>'

  // Load Google API script
  const script = document.createElement("script")
  script.src = "https://apis.google.com/js/api.js"
  script.onload = () => {
    console.log("Google API script loaded")
    if (typeof gapi !== "undefined") {
      gapi.load("client", initClient)
    } else {
      console.error("Google API not loaded properly")
      showErrorMessage("Error loading Google API. Please refresh the page.")
    }
  }
  script.onerror = () => {
    console.error("Failed to load Google API script")
    showErrorMessage("Failed to load Google API. Please check your connection and refresh.")
  }
  document.head.appendChild(script)
}

function initClient() {
  console.log("Initializing Google Drive API client...")
  gapi.client
    .init({
      apiKey: API_KEY,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    })
    .then(() => {
      console.log("Google Drive API initialized successfully")
      loadMedia()
    })
    .catch((error) => {
      console.error("Error initializing Google Drive API:", error)
      showErrorMessage("Error initializing Google Drive API. Please try again later.")
    })
}

function showErrorMessage(message) {
  imageGallery.innerHTML = `<div class="error-message">${message}</div>`
}

function loadMedia() {
  console.log("Loading media from Google Drive...")
  // Show loading indicator
  imageGallery.innerHTML =
    '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading wallpapers...</div>'

  gapi.client.drive.files
    .list({
      q: `'${FOLDER_ID}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`,
      fields: "files(id, name, webContentLink, mimeType)",
      orderBy: "name",
      pageSize: 320,
    })
    .then((response) => {
      console.log("API response received")
      const files = response.result.files
      if (files && files.length > 0) {
        console.log(`Loaded ${files.length} files`)
        allMedia = files
        displayMedia(allMedia, imageGallery)
      } else {
        console.log("No files found")
        showErrorMessage("No se encontraron fondos de pantalla.")
      }
    })
    .catch((error) => {
      console.error("Error loading media:", error)
      showErrorMessage("Error al cargar los fondos de pantalla. Por favor, intenta de nuevo más tarde.")
    })
}

function displayMedia(media, container) {
  container.innerHTML = ""
  if (media.length === 0) {
    container.innerHTML = '<p id="no-results">No se han encontrado resultados</p>'
    return
  }

  // Create a fragment to improve performance
  const fragment = document.createDocumentFragment()

  media.forEach((file, index) => {
    const mediaItem = createMediaItem(file, index)
    fragment.appendChild(mediaItem)
  })

  container.appendChild(fragment)
  lazyLoadMedia()
  addFavoriteIcons(container)
}

function createMediaItem(file, index) {
  const mediaItem = document.createElement("div")
  mediaItem.className = "image-item"

  const thumbnailLink = `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`

  if (file.mimeType.startsWith("image/")) {
    mediaItem.innerHTML = `
            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${thumbnailLink}" alt="${file.name}" loading="lazy" data-file-id="${file.id}">
        `
  } else if (file.mimeType.startsWith("video/")) {
    mediaItem.innerHTML = `
            <video data-poster="${thumbnailLink}" preload="none" muted data-file-id="${file.id}"></video>
        `
  }

  mediaItem
    .querySelector("img, video")
    .addEventListener("click", () => openMiniWindow(file.id, file.name, file.mimeType))

  return mediaItem
}

function lazyLoadMedia() {
  const mediaItems = document.querySelectorAll("img[data-src], video[data-poster]")
  const options = {
    root: null,
    rootMargin: "100px",
    threshold: 0.1,
  }

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const mediaItem = entry.target
        if (mediaItem.tagName === "IMG") {
          mediaItem.src = mediaItem.dataset.src
        } else if (mediaItem.tagName === "VIDEO") {
          mediaItem.poster = mediaItem.dataset.poster
        }
        observer.unobserve(mediaItem)
      }
    })
  }, options)

  mediaItems.forEach((item) => observer.observe(item))
}

function openMiniWindow(fileId, caption, mimeType) {
  let mediaContent
  if (mimeType.startsWith("image/")) {
    mediaContent = `<iframe src="https://drive.google.com/file/d/${fileId}/preview" width="100%" height="400" allow="autoplay" allowfullscreen></iframe>`
  } else if (mimeType.startsWith("video/")) {
    mediaContent = `<iframe src="https://drive.google.com/file/d/${fileId}/preview" width="100%" height="400" allow="autoplay" allowfullscreen></iframe>`
  }

  miniWindow.innerHTML = `
        <div class="mini-window-content">
            ${mediaContent}
            <p>${caption}</p>
            <a href="https://drive.google.com/uc?export=download&id=${fileId}" target="_blank" rel="noopener noreferrer">Descargar</a>
            <button onclick="closeMiniWindow()">Cerrar</button>
        </div>
    `
  miniWindow.style.display = "flex" // Changed to flex to center content
  document.body.classList.add("body-no-scroll") // Block vertical scroll when mini window is open

  if (favoritesSection.style.display === "block") {
    favoritesSection.appendChild(miniWindow)
  } else if (searchSection.style.display === "block") {
    searchSection.appendChild(miniWindow)
  } else {
    document.body.appendChild(miniWindow)
  }
}

function closeMiniWindow() {
  miniWindow.style.display = "none"
  document.body.classList.remove("body-no-scroll") // Remove scroll blocking when mini window is closed
  if (favoritesSection.contains(miniWindow)) {
    document.body.appendChild(miniWindow)
  } else if (searchSection.contains(miniWindow)) {
    document.body.appendChild(miniWindow)
  }
}

function playMusic() {
  if (!isMuted) {
    backgroundMusic.volume = 0.25
    backgroundMusic
      .play()
      .then(() => {
        console.log("La música comenzó a reproducirse")
        playMusicBtn.style.display = "none"
      })
      .catch((error) => {
        console.error("No se pudo reproducir la música automáticamente:", error)
        playMusicBtn.style.display = "block"
      })
  }
}

function changeMusic() {
  currentMusicIndex = (currentMusicIndex + 1) % musicTracks.length
  backgroundMusic.src = musicTracks[currentMusicIndex]
  playMusic()
}

function performSearch() {
  const searchTerm = searchInput.value.toLowerCase()
  if (!searchTerm.trim()) return

  console.log("Searching for:", searchTerm)
  searchResults.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>'

  const filteredMedia = allMedia.filter((file) => file.name.toLowerCase().includes(searchTerm))

  console.log("Search results:", filteredMedia.length)
  displayMedia(filteredMedia, searchResults)
}

function showSearchSection() {
  searchSection.style.display = "block"
  searchInput.focus()
}

function hideSearchSection() {
  searchSection.style.display = "none"
  searchInput.value = ""
}

function toggleMute() {
  isMuted = !isMuted
  if (isMuted) {
    backgroundMusic.pause()
    muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>'
  } else {
    playMusic()
    muteButton.innerHTML = '<i class="fas fa-volume-up"></i>'
  }
}

function addFavoriteIcons(container) {
  const mediaItems = container.querySelectorAll(".image-item")
  mediaItems.forEach((item) => {
    if (!item.querySelector(".favorite-icon")) {
      const favoriteIcon = document.createElement("i")
      favoriteIcon.className = "far fa-star favorite-icon"
      favoriteIcon.addEventListener("click", (e) => {
        e.stopPropagation()
        toggleFavorite(item)
      })
      item.appendChild(favoriteIcon)
    }
  })
  updateFavoriteIcons(container)
}

function toggleFavorite(item) {
  const icon = item.querySelector(".favorite-icon")
  icon.classList.toggle("fas")
  icon.classList.toggle("far")
  updateFavorites(item)
}

function updateFavorites(item) {
  const fileId = item.querySelector("img, video").dataset.fileId
  let favorites = JSON.parse(localStorage.getItem("favorites")) || []

  if (item.querySelector(".favorite-icon.fas")) {
    if (!favorites.includes(fileId)) {
      favorites.push(fileId)
    }
  } else {
    favorites = favorites.filter((id) => id !== fileId)
  }

  localStorage.setItem("favorites", JSON.stringify(favorites))
  if (favoritesSection.style.display === "block") {
    showFavorites()
  }
}

function updateFavoriteIcons(container) {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || []
  container.querySelectorAll(".image-item").forEach((item) => {
    const fileId = item.querySelector("img, video").dataset.fileId
    const icon = item.querySelector(".favorite-icon")
    if (favorites.includes(fileId)) {
      icon.classList.remove("far")
      icon.classList.add("fas")
    } else {
      icon.classList.remove("fas")
      icon.classList.add("far")
    }
  })
}

function showFavorites() {
  favoritesGrid.innerHTML = ""

  const favorites = JSON.parse(localStorage.getItem("favorites")) || []
  const favoriteItems = allMedia.filter((file) => favorites.includes(file.id))

  displayMedia(favoriteItems, favoritesGrid)
  favoritesSection.style.display = "block"
  document.body.classList.add("body-no-scroll")
}

function hideFavorites() {
  favoritesSection.style.display = "none"
  document.body.classList.remove("body-no-scroll")
  if (favoritesSection.contains(miniWindow)) {
    document.body.appendChild(miniWindow)
    closeMiniWindow()
  }
}

function initializeAudio() {
  backgroundMusic.src = musicTracks[currentMusicIndex]
  playMusic()
}

window.addEventListener("load", () => {
  console.log("Window loaded, initializing app...")
  positionFloatingShapes()

  // Load Google Drive API
  loadGoogleDriveAPI()

  initializeAudio()

  // Fix search functionality
  searchIcon.addEventListener("click", showSearchSection)
  searchButton.addEventListener("click", performSearch)
  searchBackButton.addEventListener("click", hideSearchSection)
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") performSearch()
  })

  backButton.addEventListener("click", hideFavorites)
  muteButton.addEventListener("click", toggleMute)
  favoritesButton.addEventListener("click", showFavorites)
  changeMusicButton.addEventListener("click", changeMusic)
  playMusicBtn.addEventListener("click", playMusic)
})

window.addEventListener("focus", () => {
  if (!isMuted && backgroundMusic.paused) {
    playMusic()
  }
})
      
