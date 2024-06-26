/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from './Card';
import MovieModal from './MovieModal';
import SingleMovieModal from './SingleMovieModal';
import progress from '../assets/progress.png';
import { Link } from 'react-router-dom';

const ForYou = () => {
  const [popularMovies, setPopularMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
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
        await fetchMoviesByCategory("popular", 5);
        await fetchMoviesByCategory("top_rated", 5);
        await fetchMoviesByCategory("upcoming", 5);
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
      } else if (category === "upcoming") {
        setUpcomingMovies((prev) => [...prev, ...allMovies]);
      }
    } catch (error) {
      setIsLoading(false);
      console.error(`Error fetching ${category} movies:`, error);
    }
  };

  // useEffect(() => {
  //   const fetchMovieDetails = async (movieId) => {
  //       const apiKey = '035c0f1a7347b310a5b95929826fc81f';
  //       const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=videos,release_dates`);
  //       const data = await response.json();
  //       if (data.release_dates.results[0].release_dates[0].type === (3 || 4)) {
  //         return 'hd';
  //       } else {
  //         return 'recorded';
  //       }
  //     };
  //   // fetchMovieDetails(upcomingMovies.map(movie => movie.id));
  //   }
  // ,[upcomingMovies]);

  return (
    <div className='flex flex-col items-left px-8 md:px-40 my-12 md:my-24 w-[95vw]'>
      {openModal && (
        <MovieModal
          toggler={openModal}
          title="For You"
          movieCategory="/movie/upcoming"
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
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
          </svg>

          </span>For You</h1>
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
            {upcomingMovies.map((upcoming) => (
              <Link
                  onClick={() => {
                  setMovieId(upcoming.id)
                  setMovieTitle(upcoming.original_title)
                  setOpenMovieModal(true)
                  }} >
                <Card key={upcoming.id} src={upcoming.poster_path} rating={upcoming.vote_average < 2 ? "5.2" : upcoming.vote_average} year={upcoming.release_date} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForYou;
