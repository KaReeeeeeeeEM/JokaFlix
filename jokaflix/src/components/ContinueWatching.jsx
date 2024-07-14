/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import progress from '../assets/progress.png';
import { getContinueWatching } from './progressStorage';
import MediaPlayer from './MediaPlayer';

const ContinueWatching = () => {
  const [continueWatching, setContinueWatching] = useState([]);
  const [openMovieModal, setOpenMovieModal] = useState(false);
  const [openSeriesModal, setOpenSeriesModal] = useState(false);
  const [movieId, setMovieId] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [seasonId, setSeasonId] = useState(null);
  const [seriesID, setSeriesID] = useState(null);
  const [seriesTitle, setSeriesTitle] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(0);

  useEffect(() => {
    const savedContinueWatching = getContinueWatching();
    setContinueWatching(savedContinueWatching);
    setIsLoading(false);
  }, [setContinueWatching]);

  return (
    <div className='flex flex-col items-left px-8 md:px-40 my-12 md:my-24 w-[98vw]'>
      {openMovieModal && (
        <MediaPlayer
          toggler={openMovieModal}
          movieTitle={movieTitle}
          movieId={movieId}
          onClose={() => setOpenMovieModal(false)}
        />
      )}
      {openSeriesModal && (
          <MediaPlayer
            toggler={openSeriesModal}
            seriesTitle={seriesTitle}
            seriesId={seriesID}
            episodeNumber={episodeNumber}
            seasonId={seasonId}
            onClose={() => setOpenSeriesModal(false)}
          />
        )}
      {continueWatching.length > 0 && <div className='flex items-center justify-between text-white font-semibold mb-8'>
        <h1 className='flex items-center text-lg md:text-2xl'>
          <span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="orange" class="size-6 mr-2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>

          </span>
          Continue Watching
        </h1>
      </div>}
      <div className="flex overflow-x-auto w-full">
        {isLoading ? (
          <div className='flex items-center justify-center bg-transparent h-[15rem] w-full lg:h-[20rem]'>
            <img src={progress} alt="progress" className='animate-spin w-8 h-8' />
          </div>
        ) : (
          <div className='flex items-center justify-start w-full flex-nowrap whitespace-nowrap'>
            {continueWatching.map((item) => (
             ( item.type === "movie" ?
               <Link
                key={item.id}
                onClick={() => {
                  setMovieId(item.id);
                  setMovieTitle(item.title);
                  setOpenMovieModal(true);
                }}
              >
                <div className='flex flex-col justify-start items-start hover:scale-105 hover:transition ease-in-out duration-700'>
                  <div key={item.id} id={item.id} style={{backgroundImage:`url(https://image.tmdb.org/t/p/original${item.poster_path})`}} className='w-[200px] h-[150px] md:w-[400px] md:h-[250px] rounded mr-4 bg-center bg-cover bg-no-repeat'></div>
                  <div className='h-1 md:h-2 rounded-full w-[200px] md:w-[400px] bg-gray-300 mt-2'>
                    <div className={`h-full w-[50px] md:w-[100px] bg-orange-400 rounded-full`}></div>
                  </div>
                  <h1 className='mt-2 text-orange-200 font-bold'>{item.title}</h1>
                </div>
              </Link>
              :
              <Link
              key={item.id}
              onClick={() => {
                setSeriesID(item.id);
                setSeriesTitle(item.title);
                setSeasonId(item.seasonId);
                setEpisodeNumber(item.episodeNumber);
                setOpenSeriesModal(true);
              }}
            >
              <div className='flex flex-col justify-start items-start hover:scale-105 hover:transition ease-in-out duration-700'>
                <div key={item.id} id={item.id}  style={{backgroundImage:`url(https://image.tmdb.org/t/p/original${item.poster_path})`}} className='w-[200px] h-[150px] md:w-[400px] md:h-[250px] rounded mr-4 bg-center bg-cover bg-no-repeat'></div>
                <div className='h-1 md:h-2 rounded-full w-[200px] md:w-[400px] bg-gray-300 mt-2'>
                  <div className='h-full w-[100px] bg-orange-500 rounded-full'></div>
                </div>
                <h1 className='mt-2 text-orange-200 font-bold'>{item.title}</h1>
              </div>
            </Link>
            )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContinueWatching;
