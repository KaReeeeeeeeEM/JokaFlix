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

export default function MovieModal({ seriesId, seriesTitle, episodeNumber, seasonId, onClose, toggler }) {
  const [open, setOpen] = useState(toggler); 
  const [moviesByCategory, setMoviesByCategory] = useState([]);
  const [searchParam, setSearchParam] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [movieId, setMovieId] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [openMovieModal, setOpenMovieModal] = useState(false);
  const [openSeriesModal, setOpenSeriesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  

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
 
  console.log(`https://autoembed.co/tv/tmdb/${seriesId}-${seasonId}-${episodeNumber}`);

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
            {seriesTitle}
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
                <DialogPanel className="relative transform overflow-y-auto rounded-lg bg-transparent text-left shadow-xl transition-all w-[90vw] lg:w-[100vw] h-[98vh] lg:h-[90vh]">
                    <div className='w-[98vw] mx-auto'>
                    <iframe 
                        title={seriesTitle}
                        src={`https://autoembed.co/tv/tmdb/${seriesId}-${seasonId}-${episodeNumber}`} 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        className='w-[98vw] h-[80vh] md:h-[88vh] mx-auto text-sm'
                        allowfullscreen >
                    </iframe>
                    </div>
                </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
