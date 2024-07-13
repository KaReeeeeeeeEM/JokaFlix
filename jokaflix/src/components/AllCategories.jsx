/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import Card from './Card';
import MovieModal from './MovieModal';
import SingleMovieModal from './SingleMovieModal';
import progress from '../assets/progress.png';
import { Link } from 'react-router-dom';
import GenreModal from './GenresModal';
/*import '../scrollbar.css';*/

const AllCategories = ({toggler, title, onClose}) => {
  const [open, setOpen] = useState(toggler);
  const [popularMovies, setPopularMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [coverMovie, setCoverMovie] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [movieId, setMovieId] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [openMovieModal, setOpenMovieModal] = useState(false);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [category, setCategory] = useState("");
  const [tvShows, setTvShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [openGenres, setOpenGenres] = useState(false);
  const [genreId, setGenreId] = useState(null);
  const [genres, setGenres] = useState([]);
  const [genresCover, setGenresCover] = useState({});

  useEffect(() => {
    setOpen(toggler);
  }, [toggler]);

  const closeModal = () => {
    setOpen(false);
    onClose();
  };

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
          `https://api.themoviedb.org/3/movie/${category}?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US&page=${page}`
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

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US`
        );
        setGenres(response.data.genres);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const genresCoverByCat = await fetchGenreCover();
        setGenresCover(genresCoverByCat);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const fetchGenreCover = async () => {
    try {
      const allGenres = await axios.get(
        `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US`
      );
      const genresData = allGenres.data.genres;
      const genreCovers = {};

      for (const genre of genresData) {
        const response = await axios.get(
          `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.REACT_APP_TMDB_API_KEY}&with_genres=${genre.id}&language=en-US&page=1`
        );
        const moviesData = response.data.results;
        if (moviesData.length >= 3) {
          genreCovers[genre.id] = moviesData[2].poster_path;
        }
      }
      return genreCovers;
    } catch (error) {
      console.error(`Error fetching genre covers:`, error);
      return {};
    }
  };

  useEffect(() => {
    const fetchMoviesByCategory = async (category, pageCount) => {
      try {
        let allMovies = [];
        for (let page = 1; page <= pageCount; page++) {
          const response = await axios.get(
            `https://api.themoviedb.org/3${category}?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US&page=${page}`
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
        } else if (category === "/movie/now_playing") {
          setNowPlaying((prev) => [...prev, ...allMovies]);
        } else if (category === "/tv/popular") {
          setTvShows((prev) => [...prev, ...allMovies]);
        }
      } catch (error) {
        console.error(`Error fetching ${category} movies:`, error);
      }
    };

    const fetchAllMovies = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchMoviesByCategory("/movie/popular", 5),
          fetchMoviesByCategory("/movie/top_rated", 5),
          fetchMoviesByCategory("/movie/upcoming", 5),
          fetchMoviesByCategory("/movie/now_playing", 5),
          fetchMoviesByCategory("/tv/popular", 5)
        ]);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMovies();
  }, []);

  return (
    <Transition show={open}>
      <Dialog className="relative z-[1000]" onClose={closeModal}>
        <TransitionChild
          enter="ease-in-out duration-300"
          enterFrom="absolute top-[100vh] opacity-0"
          enterTo="absolute top-0 opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-95 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 w-screen overflow-y-auto">
          <div
            className="fixed top-0 left-0 z-50 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 cursor-pointer"
            onClick={closeModal}
          >
            <XCircleIcon className="h-8 w-8 text-orange-600" aria-hidden="true" />
          </div>
          <DialogTitle
            as="h3"
            className="text-center font-semibold leading-6 mt-4 text-orange-600 text-2xl"
          >
            {title}
          </DialogTitle>
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-y-auto overflow-x-hidden rounded-lg bg-transparent text-left shadow-xl transition-all w-full lg:w-[98vw] h-[95vh] lg:h-[95vh]">
                <div className='flex flex-col items-left px-8 md:px-40 my-12 md:my-24 w-[100vw]'>
                  {openModal && (
                    <MovieModal
                      toggler={openModal}
                      title={category === "/tv/popular" ? "tv shows" : category.slice(7,) + " movies"}
                      movieCategory={category}
                      onClose={() => setOpenModal(false)}
                    />
                  )}
                  {openGenres && (
                    <GenreModal
                      toggler={openGenres}
                      title={selectedGenre}
                      genreId={genreId}
                      movieCategory={selectedGenre}
                      onClose={() => setOpenGenres(false)}
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
                    {
                        isLoading ? 
                        <div className='flex items-center justify-center bg-transparent h-[15rem] w-full lg:h-[20rem]'>
                            <img src={progress} alt="progress" className='animate-spin w-8 h-8' />
                        </div>
                        :  
                            <div className="flex overflow-x-auto w-full">
                                <div className="flex w-full items-center justify-center">
                                    <div className='flex w-full items-center justify-start flex-wrap'>
                                        <Link onClick={() => {
                                        setCategory("/movie/popular")
                                        setOpenModal(true)
                                        }}>
                                        <Card key={popularMovies[3]?.id} src={popularMovies[3]?.poster_path} category="popular" />
                                        </Link>
                                        <Link onClick={() => {
                                        setCategory("/movie/top_rated")
                                        setOpenModal(true)
                                        }}>
                                        <Card key={trendingMovies[3]?.id} src={trendingMovies[3]?.poster_path} category="top rated" />
                                        </Link>
                                        <Link onClick={() => {
                                        setCategory("/movie/upcoming")
                                        setOpenModal(true)
                                        }}>
                                        <Card key={upcomingMovies[2]?.id} src={upcomingMovies[3]?.poster_path} category="upcoming" />
                                        </Link>
                                        <Link onClick={() => {
                                        setCategory("/movie/now_playing")
                                        setOpenModal(true)
                                        }}>
                                        <Card key={nowPlaying[3]?.id} src={nowPlaying[3]?.poster_path} category="now playing" />
                                        </Link>
                                        <Link onClick={() => {
                                        setCategory("/tv/popular")
                                        setOpenModal(true)
                                        }}>
                                        <Card key={tvShows[3]?.id} src={tvShows[3]?.poster_path} category="tv shows" />
                                        </Link>
                                        {
                                        genres.map(
                                            (genre) => 
                                            <Link key={genre.id} onClick={() => {
                                                setGenreId(genre.id)
                                                setSelectedGenre(genre.name)
                                                setOpenGenres(true)
                                            }}>
                                                <Card key={genre.id} src={genresCover[genre.id]} category={genre.name} />
                                            </Link>
                                        )
                                    }
                                </div>
                                </div>
                            </div>
                        }
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
 
export default AllCategories;
