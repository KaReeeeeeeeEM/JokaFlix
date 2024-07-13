/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import progress from '../assets/progress.png';
import SingleMovieModal from './SingleMovieModal';
import SingleSeriesModal from './SingleSeriesModal';
import axios from 'axios';
import Card from './Card';
import { Link } from 'react-router-dom';

export default function Watchlist({ toggler, onClose }) {
  const [open, setOpen] = useState(toggler);
  const [isLoading, setIsLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [content, setContent] = useState([]);
  const [movieId, setMovieId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [openMovieModal, setOpenMovieModal] = useState(false);
  const [openSeriesModal, setOpenSeriesModal] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const localStorageContent = localStorage.getItem('watchlist');
        if (localStorageContent) {
          const parsedContent = JSON.parse(localStorageContent);
          setWatchlist(parsedContent);
          const seriesDetails = await Promise.all(parsedContent.map(fetchSeriesByCategory));
          setContent(seriesDetails);
          await fetchRecommendations(parsedContent, seriesDetails);
        }
      } catch (error) {
        console.error("Error fetching series:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [watchlist]);

  const fetchSeriesByCategory = async (id) => {
    if (id) {
      try {
        const response = await axios.get(`https://api.themoviedb.org/3${id}?api_key=${process.env.REACT_APP_TMDB_API_KEY}`);
        return [response.data];
      } catch (error) {
        console.error(`Error fetching movie:`, error);
        return [];
      }
    }
    return [];
  };

  const fetchRecommendations = async (watchlist) => {
    try {
      const allRecommendations = [];
      if (watchlist.length > 0) {
        for (const movie of watchlist) {
          const response = await axios.get(
            `https://api.themoviedb.org/3${movie}/recommendations?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US&page=1`
          );
          allRecommendations.push(...response.data.results);
        }
      } else {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US&page=1`
        );
        allRecommendations.push(...response.data.results);
      }
      setSuggestions(allRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  useEffect(() => {
    setOpen(toggler);
  }, [toggler]);

  const closeModal = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Transition show={open}>
      <Dialog className="relative z-50" onClose={closeModal}>
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
            Watchlist
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
                {openMovieModal && (
                  <SingleMovieModal
                    toggler={openMovieModal}
                    title={movieTitle}
                    movieId={`/movie/${movieId}`}
                    onClose={() => setOpenMovieModal(false)}
                  />
                )}
                {openSeriesModal && (
                  <SingleSeriesModal
                    toggler={openSeriesModal}
                    title={seriesTitle}
                    seriesId={`/tv/${seriesId}`}
                    onClose={() => setOpenSeriesModal(false)}
                  />
                )}
                <h1 className='text-left font-semibold leading-6 mt-8 ml-2 md:mt-16 text-orange-400 md:text-lg md:ml-2'>Your Watchlist</h1>
                {isLoading ? (
                  <div className="flex items-center justify-center bg-transparent w-full h-full rounded-xl mb-4 mx-1">
                    <img src={progress} alt="progress" className="animate-spin w-8 h-8" />
                  </div>
                ) : (
                  <div className="flex overflow-x-auto w-full mt-4 md:mt-8">
                    <div className='flex items-center justify-start w-full flex-nowrap whitespace-nowrap'>
                      {content.length > 0 ? 
                        content.map((upcoming) => (
                          (!upcoming[0].seasons || !upcoming[0].number_of_episodes || !upcoming[0].number_of_seasons) ? (
                            <Link 
                              key={upcoming[0].id}
                              onClick={() => {
                                setMovieId(upcoming[0].id)
                                setMovieTitle(upcoming[0].original_title || upcoming[0].original_name)
                                setOpenMovieModal(true)
                              }}
                            >
                              <Card id={upcoming[0].id} src={upcoming[0].poster_path} rating={upcoming[0].vote_average < 2 ? "5.2" : upcoming[0].vote_average} year={upcoming[0].release_date || upcoming[0].first_air_date} />
                            </Link>)
                          :
                            (
                            <Link
                              key={upcoming[0].id}
                              onClick={() => {
                                setSeriesId(upcoming[0].id)
                                setSeriesTitle(upcoming[0].original_name || upcoming[0].original_title)
                                setOpenSeriesModal(true)
                              }} 
                            >
                              <Card id={upcoming[0].id} src={upcoming[0].poster_path} rating={upcoming[0].vote_average < 2 ? "5.2" : upcoming[0].vote_average} year={upcoming[0].release_date || upcoming[0].first_air_date} />
                            </Link>
                          )
                        ))
                      :
                        <div className="flex items-center justify-center w-full h-full">
                          <p className="text-center text-gray-400">No items in your watchlist.</p>
                        </div>
                      }
                    </div>
                  </div>
                )}

                <h1 className='mt-16 md:mt-32 md:text-lg text-center mb-4 font-bold text-orange-600'>Suggestions</h1>
                <div className="flex w-full flex-wrap items-center justify-center">
                  {suggestions.map(movie => (
                    (!movie.media_type || movie.media_type !== "tv" || !movie.seasons) ? 
                    (<Link 
                      key={movie.id}
                      onClick={() => {
                        setMovieId(movie.id);
                        setMovieTitle(movie.original_title || movie.original_name);
                        setOpenMovieModal(true);
                      }}
                    >
                      {movie.poster_path && !watchlist.includes(`/movie/${movie.id}`) && (movie.first_air_date || movie.release_date) && (
                        <Card src={movie.poster_path} rating={movie.vote_average < 2 ? "5.2" : movie.vote_average} year={movie.first_air_date || movie.release_date} />
                      )}
                    </Link>) 
                    : (
                      <Link
                      key={movie.id}
                      onClick={() => {
                        setSeriesId(movie.id)
                        setSeriesTitle(movie.original_name || movie.original_title)
                        setOpenSeriesModal(true)
                      }} 
                    >
                    {movie.poster_path && !watchlist.includes(`/tv/${movie.id}`) && (movie.first_air_date || movie.release_date) && (
                      <Card id={movie.id} src={movie.poster_path || movie.backdrop_path} rating={movie.vote_average < 2 ? "5.2" : movie.vote_average} year={movie.release_date || movie.first_air_date} />
                      )}
                    </Link>
                    
                    )
                  ))}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
