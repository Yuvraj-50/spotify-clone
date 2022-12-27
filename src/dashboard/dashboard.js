import { fetchRequest } from "../api";
import {
  ENDPOINT,
  getItemFromLocalStorage,
  LOADED_TRACKS,
  logout,
  SECTIONTYPE,
  setItemsInLocalStorate,
} from "../common";

const audio = new Audio();
let displayName;
//////////// get and set user profile picture //////////////

const loadUserProfile = () => {
  return new Promise(async (resolve, reject) => {
    const defaultProfileImg = document.getElementById("default-profile-img");
    const profilePicture = document.getElementById("profile-picture");
    const profileBtn = document.getElementById("user-profile-btn");
    const displayNameEle = document.getElementById("display-name");
    const { display_name: displayName, images } = await fetchRequest(
      ENDPOINT.userInfo
    );

    displayNameEle.textContent = displayName;

    profileBtn.addEventListener("click", onProfileBtnClick);
    if (images) {
      profilePicture.src = images[0].url;
      profilePicture.classList.remove("hidden");
      defaultProfileImg.classList.add("hidden");
    }
    resolve({ displayName });
  });
};

//// show menu on click
const onProfileBtnClick = (e) => {
  e.stopPropagation();
  const profileMenu = document.getElementById("profile-menu");
  profileMenu.classList.toggle("hidden");
  if (!profileMenu.classList.contains("hidden")) {
    profileMenu.querySelector("li#logout").addEventListener("click", logout);
  }
};

////// get featured playlist //////////////////

const onFeaturedPlaylistClick = (e, id) => {
  const section = { type: SECTIONTYPE.PLAYLIST, playListId: id };
  history.pushState(section, "", `playlist/${id}`);
  loadSections(section);
};

const loadPlayList = async (endpoint, elementid) => {
  const FeaturedplaylistSection = document.getElementById(`${elementid}`);
  const {
    playlists: { items },
  } = await fetchRequest(endpoint);

  for (let { name, description, images, id } of items) {
    const playListItem = document.createElement("section");
    playListItem.className =
      "bg-black-secondary rounded p-4 cursor-pointer hover:bg-light-black";
    playListItem.id = id;
    playListItem.setAttribute("data-type", "playlist");
    const [{ url: imageUrl }] = images;
    playListItem.innerHTML = `
      <img src="${imageUrl}" alt="${name}" class="mb-2 rounded object-contain shadow" />
      <h2 class="text-base font-semibold truncate">${name}</h2>
      <h3 class="text-sm text-secondary mb-4 line-clamp-2">${description}</h3>
      `;
    FeaturedplaylistSection.appendChild(playListItem);
    playListItem.addEventListener("click", (event) =>
      onFeaturedPlaylistClick(event, id)
    );
  }
};

const loadPlaylists = () => {
  loadPlayList(ENDPOINT.featurePlaylist, "featured-playist-items");
  loadPlayList(ENDPOINT.topLists, "top-playlist-items");
};

const fillContentForDashboard = () => {
  const pageContentContainer = document.getElementById("page-content");
  const coverContent = document.getElementById("cover-content");
  coverContent.innerHTML = `<h1 class="text-6xl">Hello ${displayName}</h1>`;
  const playistMap = new Map([
    ["featured", "featured-playist-items"],
    ["top playlist", "top-playlist-items"],
  ]);
  let html = "";
  for (let [type, id] of playistMap) {
    html += `
        <article class="p-4">
          <h1 class="text-2xl mb-4 font-bold capitalize">${type}</h1>
          <section id="${id}" class="featured-songs grid grid-cols-auto-fill-cards gap-4 "></section>
        </article>
    `;
  }
  pageContentContainer.innerHTML = html;
};

const onTrackSelection = (e, id) => {
  document.querySelectorAll("#tracks .track").forEach((trackItem) => {
    if (trackItem.id === id) {
      trackItem.classList.add("selected", "bg-gray");
    } else {
      trackItem.classList.remove("selected", "bg-gray");
    }
  });
};

// const timeLine = document.
const updateIconForPlay = (id) => {
  const playButton = document.getElementById("play");
  playButton.querySelector("span").textContent = "pause_circle";
  const playButtonFromTracks = document.getElementById(`play-track-${id}`);
  if (playButtonFromTracks) {
    playButtonFromTracks.textContent = "pause";
  }
};

const updateIconForPause = (id) => {
  const playButton = document.getElementById("play");
  playButton.querySelector("span").textContent = "play_circle";
  const playButtonFromTracks = document.getElementById(`play-track-${id}`);
  if (playButtonFromTracks) {
    playButtonFromTracks.textContent = "play_arrow";
  }
};

const onAudioMetaDataLoaded = (id) => {
  const totalSongDuration = document.getElementById("total-song-duration");
  totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
};

const togglePlay = () => {
  if (audio.src) {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }
};

const findCurrentTrack = () => {
  const audioControl = document.getElementById("audio-control");
  const trackId = audioControl.getAttribute("data-track-id");
  if (trackId) {
    const loadedTracks = getItemFromLocalStorage(LOADED_TRACKS);
    const currentTrackIndex = loadedTracks?.findIndex(
      (trk) => trk.id === trackId
    );
    return { currentTrackIndex, tracks: loadedTracks };
  }
  return null;
};

const nextPlayTrack = () => {
  const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
  if (currentTrackIndex > -1 && currentTrackIndex < tracks?.length - 1) {
    playTrack(null, tracks[currentTrackIndex + 1]);
  }
};

const previousPlayTrack = () => {
  const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
  if (currentTrackIndex > 0) {
    playTrack(null, tracks[currentTrackIndex - 1]);
  }
};

const playTrack = (e, { image, artistName, name, previewUrl, id }) => {
  if (e?.stopPropagation) {
    e?.stopPropagation();
  }
  if (audio.src === previewUrl) {
    togglePlay();
  } else {
    const nowPlayingSongImg = document.getElementById("now-playing-img");
    const nowPlayingSongName = document.getElementById("now-playing-song");
    const nowPlaingArtists = document.getElementById("now-plaing-artists");
    const audioControl = document.getElementById("audio-control");
    const songInfo = document.getElementById("song-info");

    audioControl.setAttribute("data-track-id", id);
    nowPlayingSongImg.src = image;
    nowPlayingSongName.textContent = name;
    nowPlaingArtists.textContent = artistName;
    audio.src = previewUrl;
    audio.play();
    songInfo.classList.remove("invisible");
  }
};

const loadPlaylistTracks = ({ tracks }) => {
  const trackSection = document.querySelector("#tracks");
  const loadedTracks = [];
  let trackNo = 1;
  for (let trackItem of tracks.items.filter((item) => item.track.preview_url)) {
    const {
      id,
      artists,
      name,
      album,
      duration_ms: duration,
      preview_url: previewUrl,
    } = trackItem.track;
    let track = document.createElement("section");
    track.id = id;
    let { url: image } = album.images.find((img) => img.height === 64);
    let artistName = Array.from(artists, (artist) => artist.name).join(", ");
    track.className =
      "track p-1 cursor-pointer grid grid-cols-[50px_1fr_1fr_50px] gap-4 place-content-center items-center hover:bg-light-black rounded-md text-secondary";
    track.innerHTML = `
    <p class="relative w-full flex items-center justify-center justify-self-start"> <span class="track-number"> ${trackNo++} </span> </p>
    <section class="grid grid-cols-[auto_1fr] place-items-center gap-2">
        <img class="h-10 w-10" src="${image}" alt="${name}">
        <article class="justify-self-start flex flex-col justify-center gap-2">
            <h2 class=" song-title text-primary  text-base line-clamp-1">${name}</h2>
            <p class="text-xs line-clamp-1">${artistName}</p>
        </article>
    </section>
    <p  class = "text-sm line-clamp-1">${album.name}</p>
    <p class="text-sm">${formatDuration(duration)}</p>
    `;
    track.addEventListener("click", (event) => onTrackSelection(event, id));
    const playButton = document.createElement("button");
    playButton.id = `play-track-${id}`;
    playButton.className = `play w-full left-0 text-lg invisible absolute material-symbols-outlined`;
    playButton.textContent = "play_arrow";
    playButton.addEventListener("click", (e) =>
      playTrack(e, { image: image, artistName, name, previewUrl, id })
    );
    track.querySelector("p").appendChild(playButton);
    trackSection.appendChild(track);
    loadedTracks.push({
      id,
      artists,
      name,
      album,
      previewUrl,
      duration,
      image,
    });
  }
  setItemsInLocalStorate(LOADED_TRACKS, loadedTracks);
};

const formatDuration = (duration) => {
  return (duration / 60_000).toFixed(2);
};

const fillContentforPlayList = async (id) => {
  const playist = await fetchRequest(`${ENDPOINT.playlist}/${id}`);
  const coverElement = document.getElementById("cover-content");
  const {
    name,
    description,
    images: [image],
    tracks,
  } = playist;
  coverElement.innerHTML = `
  <section class="grid gap-4 grid-cols-[auto_1fr]">
    <img class="w-40 h-40 object-contain" src="${image.url}" alt="">
    <section class="flex justify-center align-center flex-col">
      <h2 id="playlist-name" class="text-4xl">${name}</h2>
      <p id="playlist-artist">artistname</p>
      <p id="playlist-details">${tracks.items.length} songs</p>
    <section>
  </section>`;

  const pageContent = document.querySelector("#page-content");
  pageContent.innerHTML = `
        <header class="mx-8 z-10" id="playlist-header">
          <nav >
            <ul class="py-2 grid grid-cols-[50px_1fr_1fr_50px] border-secondary border-b-[0.5px] gap-4 text-secondary">
              <li class="justify-self-start">#</li>
              <li>Title</li>
              <li>Album</li>
              <li>🕕</li>
            </ul>
          </nav>
        </header>

        <section class="px-8 text-secondary mt-2" id="tracks"> </section>
  `;
  loadPlaylistTracks(playist);
};

const onContentScroll = (e) => {
  const { scrollTop } = e.target;
  const header = document.querySelector(".header");
  const coverContent = document.getElementById("cover-content");
  const totalHeight = coverContent.offsetHeight;
  const coverOpacity =
    100 - (scrollTop >= totalHeight ? 100 : (scrollTop / totalHeight) * 100);
  const headerOpacity =
    scrollTop >= header.offsetHeight
      ? 100
      : (scrollTop / header.offsetHeight) * 100;
  coverContent.style.opacity = `${coverOpacity}%`;
  header.style.background = `rgba(0 0 0 / ${headerOpacity}%)`;

  if (history.state.type == SECTIONTYPE.PLAYLIST) {
    const playlistHeader = document.getElementById("playlist-header");
    if (coverOpacity <= 35) {
      playlistHeader.classList.add("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.remove("mx-8");
      playlistHeader.style.top = `${header.offsetHeight}px`;
    } else {
      playlistHeader.classList.remove("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.add("mx-8");
      playlistHeader.style.top = `revert`;
    }
  }
};

const loadSections = (section) => {
  if (section.type == SECTIONTYPE.DASHBOARD) {
    fillContentForDashboard();
    loadPlaylists();
  } else if (section.type === SECTIONTYPE.PLAYLIST) {
    fillContentforPlayList(section.playListId);
  }

  document
    .querySelector(".main-content")
    .removeEventListener("scroll", onContentScroll);
  document
    .querySelector(".main-content")
    .addEventListener("scroll", onContentScroll);
};

const onUserPlaylistClick = (id) => {
  const section = { type: SECTIONTYPE.PLAYLIST, playListId: id };
  history.pushState(section, "", `/dashboard/playlist/${id}`);
  loadSections(section);
};

const loadUserPlaylist = async () => {
  const userplaylists = await fetchRequest(ENDPOINT.userplaylist);
  const userPlaylistSection = document.querySelector("#user-playlists > ul");
  for (let { name, id } of userplaylists.items) {
    const li = document.createElement("li");
    li.textContent = name;
    li.className = "cursor-pointer hover:text-primary";
    li.addEventListener("click", () => onUserPlaylistClick(id));
    userPlaylistSection.appendChild(li);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const volume = document.getElementById("volume");
  const playButton = document.getElementById("play");
  const timeLine = document.getElementById("time-line");
  const songDurationCompleted = document.getElementById(
    "song-duration-completed"
  );
  const songProgress = document.getElementById("progress-bar");
  const audioControl = document.getElementById("audio-control");
  const next = document.getElementById("next");
  const previous = document.getElementById("previous");
  let progressInterval;

  ({ displayName } = await loadUserProfile());
  loadUserPlaylist();
  // const section = {
  //   type: SECTIONTYPE.PLAYLIST,
  //   playListId: "37i9dQZF1DX1AVAcepRsUl"
  // };
  const section = { type: SECTIONTYPE.DASHBOARD };
  history.pushState(section, "", "");
  // history.pushState(section, "", `/dashboard/playlist/${section.playListId}`);
  loadSections(section);
  document.addEventListener("click", () => {
    const profileMenu = document.getElementById("profile-menu");
    if (!profileMenu.classList.contains("hidden")) {
      profileMenu.classList.add("hidden");
    }
  });

  audio.addEventListener("play", () => {
    const selectedTrackId = audioControl.getAttribute("data-track-id");
    const tracks = document.getElementById("tracks");
    const currentPlaying = tracks?.querySelector("section.playing");
    const selectedTrack = tracks?.querySelector(`[id="${selectedTrackId}"]`);

    if (currentPlaying?.id !== selectedTrack?.id) {
      currentPlaying?.classList.remove("playing");
      const button = document.getElementById(
        `play-track-${currentPlaying?.id}`
      );
      if (button) button.textContent = "play_arrow";
    }

    selectedTrack?.classList.add("playing");
    progressInterval = setInterval(() => {
      if (audio.paused) {
        return;
      }
      songDurationCompleted.textContent = `0:${audio.currentTime
        .toFixed(0)
        .padStart(2, "0")}`;
      songProgress.style.width = `${
        (audio.currentTime / audio.duration) * 100
      }%`;
    }, 100);
    updateIconForPlay(selectedTrackId);
  });

  audio.addEventListener("pause", () => {
    const selectedTrackId = audioControl.getAttribute("data-track-id");
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    updateIconForPause(selectedTrackId);
  });

  audio.addEventListener("loadedmetadata", onAudioMetaDataLoaded);
  playButton.addEventListener("click", togglePlay);

  volume.addEventListener("change", () => {
    audio.volume = volume.value / 100;
  });

  timeLine.addEventListener(
    "click",
    (e) => {
      const timeLineWidth = window.getComputedStyle(timeLine).width;
      const timeToSeek = (e.offsetX / parseInt(timeLineWidth)) * audio.duration;
      audio.currentTime = timeToSeek;
      songProgress.style.width = `${
        (audio.currentTime / audio.duration) * 100
      }%`;
    },
    false
  );

  next.addEventListener("click", nextPlayTrack);
  previous.addEventListener("click", previousPlayTrack);

  window.addEventListener("popstate", (e) => {
    loadSections(e.state);
  });
});
