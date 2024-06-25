/* eslint-disable no-unused-vars */
import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import MovieDescriptionTabs from './MovieDescriptionTabs'
import axios from 'axios';
import Card from './Card';
import imdb from '../assets/imdb.png'
import star from '../assets/star.png'
import progress from '../assets/progress.png';

export default function MovieModal({ toggler, title, type, movieId, onClose, movies }) {
  const [open, setOpen] = useState(toggler); 
  const [moviesByCategory, setMoviesByCategory] = useState([]);
  const [searchParam, setSearchParam] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayClicked, setIsPlayClicked] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (type === 'search' && open) {
      searchInputRef.current.focus();
    }
  }, [open, type]);

  useEffect(() => {
    setOpen(toggler); 
  }, [toggler]);

  const closeModal = () => {
    setOpen(false); 
    onClose(); 
  };

  const openModal = () => {
    setOpen(true); 
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const moviesByCat = await fetchMoviesByCategory(movieId);
        setMoviesByCategory(moviesByCat);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMovies();
  }, [movieId]);    

  const fetchMoviesByCategory = async (id) => {
    if (id != null) {
      try {
        let movieDetails = [];
        setIsLoading(true);
        const response = await axios.get(
          `https://api.themoviedb.org/3${id}?api_key=035c0f1a7347b310a5b95929826fc81f`
        );
        const moviesData = response.data;
        movieDetails = [moviesData];
        return movieDetails;
      } catch (error) {
        setIsLoading(false);
        console.error(`Error fetching movie:`, error);
        return [];
      }
    }
    return [];
  };
  

  const handleSearch = async (e) => {
    e.preventDefault(); 
    try {
      setIsLoading(true); 
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=035c0f1a7347b310a5b95929826fc81f&query=${searchParam}`
      );
      setSearchResults(response.data.results); 
    } catch (error) {
      setIsLoading(false); 
      console.error('Error fetching movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchMovie = async () => {
    try {
      setIsLoading(true); 
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/multi?api_key=035c0f1a7347b310a5b95929826fc81f&query=${searchParam}`
      );

      // const response = await axios.get(`https://api.themoviedb.org/3/search/multi`, {
      //   params: {
      //     api_key: '035c0f1a7347b310a5b95929826fc81f',
      //     query: `${searchParam}`,
      //     language: 'en-US',
      //     page: 1 
      //   }
      // })

      setSearchResults(response.data.results); 
    } catch (error) {
      setIsLoading(false); 
      console.error('Error fetching movies:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function playMovie(){
    window.location.href=`https://autoembed.co/movie/tmdb/${movieId.slice(7,)}`;
  }

  return (
    <Transition show={open}>
      <Dialog className="relative z-50" onClose={openModal}>
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
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              {type === 'search' ? (
                <div>
                      <form onSubmit={handleSearch}>
                        <input
                          type="search"
                          placeholder="Search for a movie..."
                          className="w-full bg-gray-100 border-2 border-gray-300 focus:outline-none focus:border-orange-600 rounded-md py-2 px-4 text-gray-700 placeholder-orange-300 text-sm sm:text-base"
                          value={searchParam}
                          onChange={(e) => {
                            setSearchParam(e.target.value);
                            searchMovie();
                          }}
                          ref={searchInputRef}
                        />
                      </form>
                  <DialogPanel className="relative transform overflow-y-auto rounded-lg bg-transparent text-left shadow-xl transition-all w-[96vw] lg:w-[80vw] h-[95vh] lg:h-[90vh]">
                    {isLoading && (
                      <div className="flex items-center justify-center bg-transparent w-full h-full rounded-xl mb-4 mx-1">
                        <img src={progress} alt="progress" className="animate-spin w-8 h-8" />
                      </div>
                    )}
                    <div className="bg-transparent px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="text-center sm:mt-0 sm:text-left">
                          <div className="flex flex-wrap items-center justify-center mt-2 w-full">
                            {searchResults.map((result) => (
                              (result.poster_path === null && result.backdrop_path === null) ?
                                ""
                                :
                                <Card
                                  key={result.id}
                                  src={result.poster_path || result.backdrop_path}
                                  rating={result.vote_average < 2 || result.vote_average === null  ? "5.2" : result.vote_average}
                                />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogPanel>
                </div>
              ) : (
                <DialogPanel className="relative transform overflow-y-auto overflow-x-hidden rounded-lg bg-transparent text-left shadow-xl transition-all w-full lg:w-[98vw] h-[95vh] lg:h-[95vh]">
                  <div className="bg-transparent px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="text-center  sm:text-left">
                        <div className="flex flex-wrap items-center justify-center mt-2">
                          {moviesByCategory.map((result) => (
                            // single movie display
                            <div className='w-screen md:w-full h-auto flex flex-col mx-2'>
                              <div className='w-[93vw] h-[50vh] lg:h-[70vh]'>
                                <div className="absolute top-8 right-0 h-[55vh] lg:h-[70vh] w-full inset-0 bg-opacity-60 bg-gray-900 blur-md"></div>
                                <div style={{backgroundImage:`url(https://image.tmdb.org/t/p/original${result.poster_path})`}} className='w-full h-full bg-center bg-cover rounded-lg'></div>
                              </div>
                              <div className='flex items-center'>
                                <img src={imdb} alt='imdb' className='w-[4rem] h-[4rem]' />
                                {result.vote_average && <h1 className='flex items-center text-lg text-white font-bold mx-2'><span className='w-6 h-4'><img src={star} alt="star" className='w-4 h-4 ml-1' /></span>{result.vote_average < 1 ? 5.2 : Math.ceil(result.vote_average * 10)/10} <span className='mx-2 text-orange-600'>|</span> </h1>}
                                <p className='text-xl font-bold text-orange-300'>{result.release_date.slice(0,4)}</p>
                                <span className='mx-2 text-lg font-bold text-orange-600'></span>
                              </div>
                              <div className='flex flex-col justify-center items-start text-left'>
                                <p className='text-xl font-bold lg:text-2xl text-orange-600'>{result.title}</p>
                                <div className='flex mb-2'>
                                  <h2 className='uppercase text-orange-300 text-lg'>{result.original_language}</h2>
                                  <span className='mx-2 text-lg font-bold text-orange-300'>-</span>
                                  <h3 className='text-lg text-gray-500'>{result.runtime > 60 ? Math.floor(result.runtime/60) + "hrs " + (result.runtime%60) + "mins " : result.runtime + "mins"}</h3>
                                </div>
                                <div className='flex items-center flex-wrap w-full justify-start my-2'>
                                    {result.genres.map(genre => genre.name && <h1 className='px-2 md:px-8 md:py-2 my-1 text-orange-200 font-bold rounded-full border-2 border-orange-200 text-center mx-1 hover:bg-orange-500 transition ease-in-out duration-700 cursor-pointer'>{genre.name}</h1>)}
                                </div>
                                {result.tagline&&<span className='ml-1 md:ml-0 text-orange-300 italic text-sm'>{result.tagline}</span>}
                                <p className='text-sm md:text-lg text-gray-400 ml-1 md:ml-0'>{result.overview}</p>
                              </div>
                              <div className='w-full px-2 md:px-0 flex items-center justify-start lg:text-lg'>
                                  <button onClick={playMovie} className='px-12 py-2  bg-orange-500 text-center text-white font-semibold rounded-full flex hover:opacity-65 transition ease-in-out duration-700'>
                                      Watch Now
                                  </button>
                                    <h2 className='text-xl text-white mx-4 my-8'> | </h2>
                                  <button className='py-2 px-4 mx-4 md:py-4 md:px-4 bg-gray-400 text-white font-semibold rounded-full hover:opacity-65 transition ease-in-out duration-700'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                  </button>
                              </div> 
                              <div className='flex items-center w-full justify-around mt-8'>
                                  {result.production_companies.map(company => company.logo_path && <img src={`https://image.tmdb.org/t/p/w500${company.logo_path}`} alt='company-logo' className='w-8 h-4 md:w-20 md:h-full rounded-lg md:border-2 md:border-gray-800 md:p-2' />)}
                              </div>
                              <div className='mt-4 md:mt-16'>
                                <MovieDescriptionTabs movieID={movieId} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              )}
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
