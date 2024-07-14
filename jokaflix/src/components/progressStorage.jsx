// progressStorage.js

const getVideoProgressKey = (id, server) => `video-progress-${id}-${server}`;

export const getVideoProgress = (id, server) => {
  const progress = JSON.parse(localStorage.getItem(getVideoProgressKey(id, server))) || 0;
  // console.log(`Retrieved progress for ${id} on server ${server}:`, progress);
  return progress;
};

export const saveVideoProgress = (id, server, time) => {
  localStorage.setItem(getVideoProgressKey(id, server), JSON.stringify(time));
  // console.log(`Saved progress for ${id} on server ${server}:`, time);
};

export const getContinueWatching = () => {
  const continueWatching = JSON.parse(localStorage.getItem('continue-watching')) || [];
  // console.log(`Retrieved continue watching list:`, continueWatching);
  return continueWatching;
};

export const addToContinueWatching = (video) => {
  const continueWatching = getContinueWatching();
  const existingIndex = continueWatching.findIndex(v => v.id === video.id && v.server === video.server);

  if (existingIndex !== -1) {
    continueWatching[existingIndex] = { ...continueWatching[existingIndex], time: video.time };
  } else {
    continueWatching.push(video);
  }

  localStorage.setItem('continue-watching', JSON.stringify(continueWatching));
};
