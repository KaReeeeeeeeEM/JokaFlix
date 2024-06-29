/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import Card from './Card';
import SingleMovieModal from './SingleMovieModal';
import SingleSeriesModal from './SingleSeriesModal';
import progress from '../assets/progress.png';
import { Link } from 'react-router-dom';

export default function GenreModal({ toggler, title, type, onClose, genreId }) {
  const [open, setOpen] = useState(toggler);
  const [moviesByCategory, setMoviesByCategory] = useState([]);
  const [searchParam, setSearchParam] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [movieId, setMovieId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [openMovieModal, setOpenMovieModal] = useState(false);
  const [openSeriesModal, setOpenSeriesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (type === 'search' && open) {
      const input = document.querySelector('input[type="search"]');
      if (input) {
        input.focus();
      }
    }
  }, [open, type]);

  const focusSearch = () => {
    const input = document.querySelector('input[type="search"]');
    if (input) {
      input.focus();
    }
  }

  useEffect(() => {
    setOpen(toggler);
  }, [toggler]);

  const closeModal = () => {
    setOpen(false);
    onClose();
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const moviesByCat = await fetchMoviesByCategory(genreId, 5);
        setMoviesByCategory(moviesByCat);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open && genreId) {
      fetchMovies();
    }
  }, [open, genreId]);

  const fetchMoviesByCategory = async (genreId, pageCount) => {
    if (genreId != null) {
      try {
        let allMovies = [];
        setIsLoading(true);
        for (let page = 1; page <= pageCount; page++) {
          const response = await axios.get(
            `https://api.themoviedb.org/3/discover/movie?api_key=035c0f1a7347b310a5b95929826fc81f&with_genres=${genreId}&language=en-US&page=${page}`
          );
          const moviesData = response.data.results;
          allMovies = [...allMovies, ...moviesData];
        }
        return allMovies;
      } catch (error) {
        setIsLoading(false);
        console.error(`Error fetching movies with genreId ${genreId}:`, error);
        return [];
      }
    }
    return [];
  };

  return (
    <Transition show={open}>
      <Dialog className="relative z-50" onClose={focusSearch}>
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
              { (
                <DialogPanel className="relative transform overflow-y-auto rounded-lg bg-transparent text-left shadow-xl transition-all w-[90vw] lg:w-[80vw] h-[95vh] lg:h-[90vh]">
                  {openMovieModal && (
                    <SingleMovieModal
                      toggler={openMovieModal}
                      title={movieTitle}
                      movieId={`/movie/${movieId}`}
                      onClose={() => setOpenMovieModal(false)}
                    />
                  )}
                  <div className="bg-transparent px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <div className="flex flex-wrap items-center justify-center mt-2 w-full">
                          {moviesByCategory.map((result) => (
                            (result.poster_path === null && result.backdrop_path === null) ?
                              ""
                              :
                              <Link
                                onClick={() => {
                                  setMovieId(result.id)
                                  setMovieTitle(result.original_title)
                                  setOpenMovieModal(true)
                                }} >
                                <Card
                                  key={result.id}
                                  src={result.poster_path || result.backdrop_path}
                                  rating={result.vote_average < 2 || result.vote_average === null ? "5.2" : result.vote_average}
                                  year={result.release_date || result.first_air_date || result.release_air_date}
                                />
                              </Link>
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
