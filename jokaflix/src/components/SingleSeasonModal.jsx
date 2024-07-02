/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import MediaPlayer from './MediaPlayer';
import progress from '../assets/progress.png';
import play from '../assets/play.gif';
import { Link } from 'react-router-dom';

export default function MovieModal({ toggler, title, seriesId, seasonID, onClose }) {
  const [open, setOpen] = useState(toggler);
  const [episodes, setEpisodes] = useState([]);
  const [backdrops, setBackdrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seasonId, setSeasonId] = useState(null);
  const [seriesID, setSeriesID] = useState(null);
  const [seriesTitle, setSeriesTitle] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(0);
  const [openSeasonModal, setOpenSeasonModal] = useState(false);
  const [openMediaPlayer, setOpenMediaPlayer] = useState(false);

  useEffect(() => {
    setOpen(toggler);
  }, [toggler]);

  const closeModal = () => {
    setOpen(false);
    onClose();
  };

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (seriesId) {
        try {
          setIsLoading(true);
          const response = await axios.get(
            `https://api.themoviedb.org/3${seriesId}/season/${seasonID}?api_key=035c0f1a7347b310a5b95929826fc81f`
          );

          const backdropsResponse = await axios.get(
            `https://api.themoviedb.org/3${seriesId}/images?api_key=035c0f1a7347b310a5b95929826fc81f`
          );

          if (response.data && response.data.episodes) {
            setEpisodes(response.data.episodes);
            if(backdropsResponse){
                setBackdrops(backdropsResponse.data.backdrops);
            }
          } else {
            console.error('No episodes found');
          }
        } catch (error) {
          console.error('Error fetching episodes:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEpisodes();
  }, [seriesId, seasonID]);

  const getEpisodeImage = (episode) => {
    if (episode.still_path) {
      return `https://image.tmdb.org/t/p/original${episode.still_path}`;
    }
    if (backdrops.length > 0) {
      const randomBackdrop = backdrops[Math.floor(Math.random() * backdrops.length)];
      return `https://image.tmdb.org/t/p/original${randomBackdrop.file_path}`;
    }
    // return fallbackImage; // Add your fallback image here
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
                
                     {openMediaPlayer && (
                        <MediaPlayer
                          toggler={openMediaPlayer}
                          seriesTitle={seriesTitle}
                          seriesId={seriesID}
                          episodeNumber={episodeNumber}
                          seasonId={seasonId}
                          onClose={() => setOpenMediaPlayer(false)}
                        />
                      )}
                
                {isLoading ? (
                  <div className="flex items-center justify-center bg-transparent w-full h-full rounded-xl mb-4 mx-1">
                    <img src={progress} alt="progress" className="animate-spin w-8 h-8" />
                  </div>
                ) : (
                  <div className="bg-transparent px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="text-center sm:text-left">
                        <div className="flex flex-col items-center justify-center mt-2">
                          <div className='flex flex-col w-full'>
                            <h1 className="text-orange-600 font-bold md:text-lg md:text-center mb-2 uppercase">{title}</h1>
                            <p className='text-white mb-12 md:mb-24 text-center'>{episodes[0].overview}</p>
                            <h1 className="text-orange-600 font-bold md:text-lg mb-2 text-center">Episodes</h1>
                          </div>
                          <div className="flex w-full flex-wrap">
                            <div className="w-full flex items-center flex-wrap">
                                <div className="w-[85vw] md:flex md:w-full items-center text-center flex-wrap md:justify-evenly rounded-lg mx-auto mb-3 md:mx-12">
                              {episodes.map((episode, index) => (
                                  <div className="flex flex-col justify-start items-start mr-2">
                                    <div
                                      style={{
                                        background: `url(${getEpisodeImage(episode)})`,
                                        backgroundPosition: 'center',
                                        backgroundSize: 'cover',
                                      }}
                                      alt="episode poster"
                                      className="w-full h-[200px] md:w-[400px] md:h-[250px] rounded-lg mr-2"
                                    >
                                      <Link 
                                        onClick={() => {
                                            setSeriesID(seriesId.slice(4,));
                                            setSeriesTitle(`${title} E${episode.episode_number}`);
                                            setSeasonId(index+1);
                                            setEpisodeNumber(episode.episode_number);
                                            setOpenMediaPlayer(true);
                                        }}
                                        >
                                        <img src={play} alt="play icon" className="w-8 h-8 md:w-12 md:h-12 relative left-[47%] top-[47%] md:left-[44%] md:top-[44%] rounded-full" />
                                      </Link>
                                    </div>
                                    <h1 className="font-bold text-white">
                                        Ep <span className='text-orange-600'>{episode.episode_number}</span>  |   {episode.name}
                                    </h1>
                                    <p className="mb-8 text-gray-600">
                                      {episode.runtime > 60
                                        ? Math.floor(episode.runtime / 60) + 'hrs ' + (episode.runtime % 60) + 'mins '
                                        : episode.runtime + 'mins'}
                                    </p>
                                  </div>
                              ))}
                            </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
