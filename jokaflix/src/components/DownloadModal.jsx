/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import progress from '../assets/progress.png';

const TMDB_API_KEY = '035c0f1a7347b310a5b95929826fc81f';
const YTS_API_URL = 'https://yts.mx/api/v2';

export default function DownloadModal({ toggler, title, tmdbId, onClose }) {
  const [open, setOpen] = useState(toggler);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);

  useEffect(() => {
    setOpen(toggler);
    if (toggler) {
      fetchMediaInfo();
    }
  }, [toggler]);

  const fetchMediaInfo = async () => {
    setIsLoading(true);
    try {
      let mediaData = null;

      // Step 1: Fetch media details using TMDB ID if available
      if (tmdbId) {
        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
          params: {
            api_key: TMDB_API_KEY,
          },
        });
        mediaData = tmdbResponse.data;
      }

      // Step 2: If TMDB ID fetch is unsuccessful or not provided, fetch using title directly
      if (!mediaData) {
        const response = await axios.get(`${YTS_API_URL}/list_movies.json`, {
          params: { query_term: title }
        });
        mediaData = response.data.data.movies[0];
      }

      // Step 3: If no movies found, fetch series using title
      if (!mediaData) {
        const response = await axios.get(`${YTS_API_URL}/list_tv_shows.json`, {
          params: { query_term: title }
        });
        mediaData = response.data.data.tv_shows[0];
      }

      // Step 4: Set the media info or handle no results
      if (mediaData) {
        setMediaInfo(mediaData);
      } else {
        setMediaInfo(null);
      }
    } catch (error) {
      console.error('Error fetching media info:', error);
      setMediaInfo(null);
    }
    setIsLoading(false);
  };

  const closeModal = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Transition show={open}>
      <Dialog className="fixed inset-0 z-[100000000] bg-gray-900 bg-opacity-80 overflow-y-auto" onClose={closeModal}>
        <TransitionChild
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute inset-0 bg-opacity-95" />
        </TransitionChild>

        <div className="relative flex items-center justify-center min-h-full p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel className="relative bg-gray-800 rounded-lg shadow-xl overflow-hidden w-full max-w-3xl">
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h1 className="text-white font-bold text-lg md:text-xl">{mediaInfo ? `Torrents for ${mediaInfo.title}` : 'Torrents'}</h1>
                <button
                  className="text-gray-400 hover:text-white focus:outline-none"
                  onClick={closeModal}
                >
                  <XCircleIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <img src={progress} alt="progress" className="animate-spin w-8 h-8" />
                  </div>
                ) : mediaInfo ? (
                  <div className="space-y-4">
                    {mediaInfo.torrents && mediaInfo.torrents.length > 0 ? (
                      mediaInfo.torrents.map((torrent, index) => (
                        <div key={index} className="p-4 border border-gray-700 rounded-lg flex items-center space-x-4">
                          <img
                            src={mediaInfo.large_cover_image}
                            alt={mediaInfo.title}
                            className="w-20 h-auto rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="text-white">{torrent.quality} - {torrent.size}</p>
                            <a
                              href={`magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(mediaInfo.title)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80/announce&tr=udp://tracker.coppersurfer.tk:6969/announce&tr=udp://tracker.leechers-paradise.org:6969/announce`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-700 inline-block mt-2"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <p className="text-white text-center">No torrents available for this title.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <p className="text-white text-center">No information available for this title.</p>
                  </div>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
