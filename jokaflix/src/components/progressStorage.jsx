// progressStorage.js

export const getVideoProgress = (id) => {
  const progress = JSON.parse(localStorage.getItem(`video-progress-${id}`)) || 0;
  // console.log(`Retrieved progress for ${id}:`, progress);
  return progress;
};

export const saveVideoProgress = (id, time) => {
  localStorage.setItem(`video-progress-${id}`, JSON.stringify(time));
  // console.log(`Saved progress for ${id}:`, time);
};

export const getContinueWatching = () => {
  const continueWatching = JSON.parse(localStorage.getItem('continue-watching')) || [];
  // console.log(`Retrieved continue watching list:`, continueWatching);
  return continueWatching;
};

export const addToContinueWatching = (video) => {
  const continueWatching = getContinueWatching();
  const existingIndex = continueWatching.findIndex(v => v.id === video.id);

  if (existingIndex !== -1) {
    continueWatching[existingIndex] = { ...continueWatching[existingIndex], time: video.time };
  } else {
    continueWatching.push(video);
  }

  localStorage.setItem('continue-watching', JSON.stringify(continueWatching));
};
