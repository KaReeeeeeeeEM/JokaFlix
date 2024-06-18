/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from './Card';
import MovieModal from './MovieModal';
import SingleMovieModal from './SingleMovieModal';
import progress from '../assets/progress.png';
import { Link } from 'react-router-dom';

const Popular = () => {
  const [popularMovies, setPopularMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [coverMovie, setCoverMovie] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [movieId, setMovieId] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [openMovieModal, setOpenMovieModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = Math.ceil(Math.random() * 10);
    setCoverMovie(id);

    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        await fetchMoviesByCategory("popular", 10);
        await fetchMoviesByCategory("top_rated", 5);
        await fetchMoviesByCategory("now_playing", 5);
      } catch (error) {
        setIsLoading(false);
        console.error("Error fetching movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const fetchMoviesByCategory = async (category, pageCount) => {
    try {
      let allMovies = [];
      setIsLoading(true);

      for (let page = 1; page <= pageCount; page++) {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${category}?api_key=035c0f1a7347b310a5b95929826fc81f&language=en-US&page=${page}`
        );

        const moviesData = response.data.results;
        allMovies = [...allMovies, ...moviesData];
      }

      if (category === "popular") {
        setPopularMovies((prev) => [...prev, ...allMovies]);
      } else if (category === "trending") {
        setTrendingMovies((prev) => [...prev, ...allMovies]);
      } else if (category === "now_playing") {
        setNowPlaying((prev) => [...prev, ...allMovies]);
      }
    } catch (error) {
      setIsLoading(false);
      console.error(`Error fetching ${category} movies:`, error);
    }
  };

  return (
    <div className='flex flex-col items-left px-8 md:px-40 my-6 md:my-24 w-[95vw]'>
      {openModal && (
        <MovieModal
          toggler={openModal}
          title="Popular Movies"
          movieCategory="/movie/popular"
          onClose={() => setOpenModal(false)}
        />
      )}
      {openMovieModal && (
        <SingleMovieModal
          toggler={openMovieModal}
          title={movieTitle}
          movieId={`/movie/${movieId}`}
          onClose={() => setOpenMovieModal(false)}
        />
      )}
      <div className='flex items-center justify-between text-white font-semibold mb-8'>
        <h1 className='flex items-center text-lg md:text-2xl'>
            <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="orange" className="size-6 mr-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
            </svg>

            </span>
            Popular Movies</h1>
        <button className='text-orange-300 text-md' onClick={() => setOpenModal(true)}>
          See All
        </button>
      </div>
      <div className="flex overflow-x-auto w-full">
        {isLoading ? (
          <div className='flex items-center justify-center bg-transparent h-[15rem] w-full lg:h-[20rem]'>
            <img src={progress} alt="progress" className='animate-spin w-8 h-8' />
          </div>
        ) : (
          <div className='flex items-center justify-start flex-nowrap whitespace-nowrap'>
            {popularMovies.slice(8,).map((upcoming) => (
              <Link
              onClick={() => {
              setMovieId(upcoming.id)
              setMovieTitle(upcoming.original_title)
              setOpenMovieModal(true)
              }} >
                <Card key={upcoming.id} src={upcoming.poster_path} rating={upcoming.vote_average < 2 ? "5.2" : upcoming.vote_average} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Popular;
