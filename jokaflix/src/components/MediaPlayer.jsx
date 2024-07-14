/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { getVideoProgress, saveVideoProgress, addToContinueWatching } from './progressStorage'; // Import utility functions

export default function MediaPlayer({ seriesId, fullSeries, poster, rating, movieRelease, seriesTitle, episodeNumber, seasonId, movieId, movieTitle, onClose, toggler }) {
  const [open, setOpen] = useState(toggler);
  const [isLoading, setIsLoading] = useState(false);
  const [currentServer, setCurrentServer] = useState('server1'); // State to track current server
  const videoRef = useRef(null);
  const videoId = seriesId ? `${seriesId}-${seasonId}-${episodeNumber}-${currentServer}` : `${movieId}-${currentServer}`;

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
        id: seriesId ? seriesId : movieId,
        title: seriesId ? seriesTitle : movieTitle,
        type: seriesId ? 'series' : 'movie',
        movieId: movieId,
        seriesId: seriesId,
        seasonId: seasonId,
        episodeNumber: episodeNumber,
        time: currentTime,
        fullSeries: fullSeries,
        server: currentServer,
        poster_path: poster,
        rating: rating,
        year: movieRelease
      };
      saveVideoProgress(videoData.id, currentTime, currentServer);
      addToContinueWatching(videoData);
    }
    setOpen(false);
    onClose();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      saveVideoProgress(videoId, currentTime, currentServer);
      addToContinueWatching({
        id: seriesId || movieId,
        title: seriesTitle || movieTitle,
        type: seriesId ? 'series' : 'movie',
        time: currentTime,
        movieId: movieId,
        seriesId: seriesId,
        seasonId: seasonId,
        episodeNumber: episodeNumber,
        fullSeries: fullSeries,
        server: currentServer,
        poster_path: poster,
        rating: rating,
        year: movieRelease
      });
    }
  };

  const switchServer = (server) => {
    setCurrentServer(server);
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
            className="text-center font-semibold leading-6 mt-4 text-white md:text-xl"
          >
            <span className='text-center font-semibold leading-6 mt-4 text-orange-600 md:text-xl'>{seriesTitle ? seriesTitle : movieTitle}</span>
            <br />
            {!fullSeries && <span className='mx-auto text-sm'>
            Click the <span className='text-orange-600'> 3-line </span>icon on the left select <span className='text-orange-600'>multi</span> for better quality
            </span>}
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
                    src={seriesId ? (fullSeries ? `https://www.2embed.skin/embedtvfull/${seriesId}` : `https://www.2embed.skin/embedtv/${seriesId}&s=${seasonId}&e=${episodeNumber}`) : `https://www.2embed.cc/embed/${movieId}`}
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
