/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from './Card';
import MovieModal from './MovieModal';
import progress from '../assets/progress.png';
import { Link } from 'react-router-dom';

const Categories = () => {
  const [popularMovies, setPopularMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [category, setCategory] = useState("");
  const [tvShows, setTvShows] = useState([]);
  const [coverMovie, setCoverMovie] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = Math.ceil(Math.random() * 10);
    setCoverMovie(id);

    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        await fetchMoviesByCategory("/movie/popular", 5);
        await fetchMoviesByCategory("/movie/top_rated", 5);
        await fetchMoviesByCategory("/movie/upcoming", 5);
        await fetchMoviesByCategory("/movie/now_playing", 5);
        await fetchMoviesByCategory("/tv/popular", 5);
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
          `https://api.themoviedb.org/3/${category}?api_key=035c0f1a7347b310a5b95929826fc81f&language=en-US&page=${page}`
        );

        const moviesData = response.data.results;
        allMovies = [...allMovies, ...moviesData];
      }

      if (category === "/movie/popular") {
        setPopularMovies((prev) => [...prev, ...allMovies]);
      } else if (category === "/movie/top_rated") {
        setTrendingMovies((prev) => [...prev, ...allMovies]);
      } else if (category === "/movie/upcoming") {
        setUpcomingMovies((prev) => [...prev, ...allMovies]);
      }else if (category === "/movie/now_playing") {
        setNowPlaying((prev) => [...prev, ...allMovies]);
      } else if(category === "/tv/popular"){
        setTvShows((prev) => [...prev,...allMovies]);
      }
    } catch (error) {
      setIsLoading(false);
      console.error(`Error fetching ${category} movies:`, error);
    }
  };

  return (
    <div className='flex flex-col items-left px-8 md:px-40 my-12 md:my-24 w-[98vw]'>
      {openModal && (
        <MovieModal
          toggler={openModal}
          title={category === "/tv/popular" ? "tv shows" : category.slice(7,) + " movies"}
          movieCategory={category}
          onClose={() => setOpenModal(false)}
        />
      )}
      <div className='flex items-left justify-between text-white font-semibold mb-8'>
        <h1 className='flex items-center text-lg md:text-2xl'>
            <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="orange" className="size-6 mr-2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>

            </span>
            Categories</h1>
      </div>
      <div className="flex overflow-x-auto w-full">
        {isLoading ? (
          <div className='flex items-center justify-center bg-transparent h-[15rem] w-full lg:h-[20rem]'>
            <img src={progress} alt="progress" className='animate-spin w-8 h-8' />
          </div>
        ) : (
          <div className='flex w-full items-center justify-start flex-nowrap overflow-y-hidden'>
              <Link onClick={() => {
                setCategory("/movie/popular")
                setOpenModal(true)
                }}>
                <Card key={popularMovies[3].id} src={popularMovies[3].poster_path} category="popular" />
              </Link>
              <Link onClick={() => {
                setCategory("/movie/top_rated")
                setOpenModal(true)
                }}>
                <Card key={trendingMovies[3].id} src={trendingMovies[3].poster_path} category="trending"  />
              </Link>
              <Link onClick={() => {
                setCategory("/movie/upcoming")
                setOpenModal(true)
                }}>
                <Card key={upcomingMovies[3].id} src={upcomingMovies[3].poster_path} category="upcoming" />
              </Link>
              <Link onClick={() => {
                setCategory("/movie/now_playing")
                setOpenModal(true)
                }}>
                <Card key={nowPlaying[3].id} src={nowPlaying[3].poster_path} category="now playing"  />
              </Link>
              <Link onClick={() => {
                setCategory("/tv/popular")
                setOpenModal(true)
                }}>
                <Card key={tvShows[3].id} src={tvShows[3].poster_path} category="tv shows"  />
              </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;