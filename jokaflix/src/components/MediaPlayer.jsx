/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { getVideoProgress, saveVideoProgress, addToContinueWatching } from './progressStorage'; // Import utility functions

export default function MediaPlayer({ seriesId, poster, rating, movieRelease, seriesTitle, episodeNumber, seasonId, movieId, movieTitle, onClose, toggler }) {
  const [open, setOpen] = useState(toggler);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const videoId = seriesId ? `${seriesId}-${seasonId}-${episodeNumber}` : movieId;

  useEffect(() => {
    setOpen(toggler);
  }, [toggler]);

  useEffect(() => {
    if (videoRef.current) {
      const savedTime = getVideoProgress(videoId);
      videoRef.current.currentTime = savedTime;
    }
  }, [videoId, open]);

  const closeModal = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const videoData = {
        id: seriesId? seriesId : movieId,
        title: seriesId ? seriesTitle : movieTitle,
        type: seriesId ? 'series' : 'movie',
        movieId: movieId,
        seriesId: seriesId,
        seasonId: seasonId,
        episodeNumber: episodeNumber,
        time: currentTime,
        poster_path: poster,
        rating: rating,
        year: movieRelease
      };
      saveVideoProgress(videoData.id, currentTime);
      addToContinueWatching(videoData);
    }
    setOpen(false);
    onClose();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      saveVideoProgress(videoId, currentTime);
      addToContinueWatching({
        id: seriesId || movieId,
        title: seriesTitle || movieTitle,
        type: seriesId ? 'series' : 'movie',
        time: currentTime,
        movieId: movieId,
        seriesId: seriesId,
        seasonId: seasonId,
        episodeNumber: episodeNumber,
        poster_path: poster,
        rating: rating,
        year: movieRelease
      });
    }
  };

  return (
    <Transition show={open}>
      <Dialog className="relative z-[10000000000000]" onClose={closeModal}>
        <TransitionChild
          enter="ease-in-out duration-300"
          enterFrom="absolute top-[100vh] opacity-0"
          enterTo="absolute top-0 opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-100 transition-opacity" />
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
            className="text-center font-semibold leading-6 mt-4 text-orange-600 md:text-xl"
          >
            {seriesTitle ? seriesTitle : movieTitle}
            <br />
            <span className='mx-auto text-sm'>
              (Use <span className='text-white'>Server 2 (then click the 3-line icon on the left select multi)</span> or <span className='text-white'>Server 3</span> for <span className='text-white'>1080</span> quality)
            </span>
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
                <div className='w-[98vw] flex flex-start items-start md:items-center md:justify-center mx-auto'>
                  <iframe
                    ref={videoRef}
                    title={seriesTitle}
                    src={seriesId ? `https://autoembed.co/tv/tmdb/${seriesId}-${seasonId}-${episodeNumber}` : `https://autoembed.co/movie/tmdb/${movieId}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    className='w-[98vw] h-[80vh] md:h-[88vh] mx-auto text-sm'
                    allowFullScreen
                    onTimeUpdate={handleTimeUpdate} // Track time updates
                  >
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
