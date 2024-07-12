export const addToWatchlist = (movie) => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    if (!watchlist.find(item => item.id === movie.id)) {
      watchlist.push(movie);
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }
  };
  
  export const removeFromWatchlist = (movieId) => {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    watchlist = watchlist.filter(item => item.id !== movieId);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  };
  
  export const getWatchlist = () => {
    return JSON.parse(localStorage.getItem('watchlist')) || [];
  };
  