/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import progress from '../assets/progress.png';


export default function DownloadModal({ toggler,movieId, query, seriesId, title, onClose }) {
  const [open, setOpen] = useState(toggler);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    setOpen(toggler);
    if (toggler) {
      fetchMediaInfo();
    }
  }, [toggler]);

  const fetchMediaInfo = async () => {
    setIsLoading(true);
    try {
     if(movieId){
       // Fetch movies
      const movieResponse = await axios.get('https://yts.mx/api/v2/list_movies.json', {
        params: { query_term: movieId }
      });
      const movies = movieResponse.data.data.movies || [];

      // If movies found, set the first movie info
      if (movies.length > 0) {
        setMediaInfo(movies[0]);
        setIsLoading(false);
        return;
      } else {
        // Fetch series if no movies found
        const seriesResponse = await axios.get('https://api.allorigins.win/raw?url=${encodeURIComponent(`https://eztv.re/api/get-torrents?limit=10&query_term=94997', {
          params: { query_term: query }
        });
        console.log(seriesResponse.data.torrents || []);
        const series = seriesResponse.data.torrents || [];
  
        // If series found, set the first series info
        if (series.length > 0) {
          setMediaInfo(series);
        } else {
          // No media found
          setMediaInfo(null);
        }
      }
}
    } catch (error) {
      console.error('Error fetching media info:', error);
    }
    setIsLoading(false);
  };

  async function getTorrents(){
    try {
      const searchResponse = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://eztv.re/api/get-torrents?limit=10&query_term=94997`)}`);
      setResults(searchResponse.data);
      console.log(results.torrents)
    } catch (err) {
      console.log(err.message);
    } finally {
      // 
    }}

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
                      <div className="flex items-center justify-center py-8">
                        <img src={progress} alt="progress" className="animate-spin w-8 h-8" />
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
