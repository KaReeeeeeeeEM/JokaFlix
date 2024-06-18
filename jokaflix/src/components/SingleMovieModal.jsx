/* eslint-disable no-unused-vars */
import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
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
        `https://api.themoviedb.org/3/search/movie?api_key=035c0f1a7347b310a5b95929826fc81f&query=${searchParam}`
      );
      setSearchResults(response.data.results); 
    } catch (error) {
      setIsLoading(false); 
      console.error('Error fetching movies:', error);
    } finally {
      setIsLoading(false);
    }
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
          <div className="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div
            className="fixed top-0 left-0 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 cursor-pointer"
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
                <DialogPanel className="relative transform overflow-y-auto rounded-lg bg-transparent text-left shadow-xl transition-all w-[90vw] lg:w-[80vw] h-[95vh] lg:h-[90vh]">
                  <div className="bg-transparent px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <div className="flex flex-wrap items-center justify-center mt-2 w-full">
                          {moviesByCategory.map((result) => (
                            // single movie display
                            <>
                                <div className="absolute top-0 h-[50vh] w-full inset-0 bg-opacity-60 bg-black blur-md"></div>
                                <div className='w-full h-[50vh] bg-gray-900' style={{backgroundImage:`url(https://image.tmdb.org/t/p/original${result.poster_path || result.backdrop_path})`, backgroundPosition:"center", backgroundSize:"cover", backgroundRepeat:"no-repeat"}}>
                                    <div className='flex items-center justify-around absolute top-[60vh] md:top-[65vh] lg:top-[55vh] left-[1.2rem] lg:left-[2.5rem] p-2 w-[8rem] h-[2rem]'>
                                        <img src={imdb} alt='imdb' className='w-[3rem] h-[3rem]' />
                                        <h1 className='flex text-xl text-white font-semibold'><span className='mx-1'><img src={star} alt="star" className='w-6 h-6' /></span>{result.vote_average < 1 ? 5.5 : Math.ceil(result.vote_average * 10 )/10}</h1>
                                    </div>
                                    
                                    <div className='w-full px-2 lg:px-12 absolute top-[65vh] md:top-[70vh] lg:top-[60vh] flex flex-col justify-between text-start items-left'>
                                        <h1 className='text-2xl md:text-4xl text-orange-400 font-extrabold'>{result.original_title }</h1>
                                        <h2 className='text-md text-gray-300 font-semibold w-[80vw] md:w-[90vw]'>
                                        {result.overview }
                                        </h2>
                                    </div>
                                    <div className='w-full px-2 md:px-12 absolute top-[85vh] md:top-[80vh] lg:top-[80vh] flex items-center lg:text-lg'>
                                            <button className='py-2 pl-4 md:py-4 md:px-16 pr-6 bg-orange-500 text-white font-semibold rounded-full flex hover:opacity-65 transition ease-in-out duration-700'>
                                                <span className='px-2'>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                                </span>
                                                Watch Now
                                            </button>
                                            <h2 className='text-2xl text-white mx-4'> | </h2>
                                            <button className='py-2 px-4 mx-4 md:py-4 md:px-4 bg-orange-400 text-white font-semibold rounded-full hover:opacity-65 transition ease-in-out duration-700'>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="size-6">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                            </svg>
                                        </button>
                                    </div>       
                                    <div>
                                        <h1 className='font-semibold text-white'>Hello</h1>    
                                    </div>  
                                </div>
                            </>
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
