/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import SingleSeriesModal from './SingleSeriesModal';
import axios from 'axios';
import Card from './Card';
import SeriesModal from './SeriesModal';
import progress from '../assets/progress.png';
import { Link } from 'react-router-dom';

const Series = () => {
  const [popularSeries, setPopularSeries] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [coverMovie, setCoverMovie] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [seriesId, setSeriesId] = useState("");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [openSeriesModal, setOpenSeriesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = Math.ceil(Math.random() * 10);
    setCoverMovie(id);

    const fetchSeries = async () => {
      try {
        setIsLoading(true);
        await fetchSeriesByCategory("popular", 10);
      } catch (error) {
        setIsLoading(false);
        console.error("Error fetching movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeries();
  }, []);

  const fetchSeriesByCategory = async (category, pageCount) => {
    try {
      let allSeries = [];
      setIsLoading(true);

      for (let page = 1; page <= pageCount; page++) {
        const response = await axios.get(
          `https://api.themoviedb.org/3/tv/${category}?api_key=035c0f1a7347b310a5b95929826fc81f&language=en-US&page=${page}`
        );

        const seriesData = response.data.results;
        allSeries = [...allSeries, ...seriesData];
      }

      if (category === "popular") {
        setPopularSeries((prev) => [...prev, ...allSeries]);
      } 
    } catch (error) {
      setIsLoading(false);
      console.error(`Error fetching ${category} series:`, error);
    }
  };

  return (
    <div className='flex flex-col items-left px-8 md:px-40 my-6 md:my-24 w-[95vw]'>
      {openModal && (
        <SeriesModal
          toggler={openModal}
          title="Popular Series"
          seriesCategory="/tv/popular"
          onClose={() => setOpenModal(false)}
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
      <div className='flex items-center justify-between text-white font-semibold mb-8'>
        <h1 className='flex items-center text-lg md:text-2xl'>
            <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="orange" className="size-6 mr-2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
            </span>
            Popular Series</h1>
        <button className='text-orange-300 text-md' onClick={() => setOpenModal(true)}>
          See All
        </button>
      </div>
      <div className="flex overflow-x-auto w-full">
        {isLoading ? (
          <div className='flex items-center justify-center bg-transparent h-[15rem] w-full lg:h-[20rem]'>
            <img src={progress} alt="progress" className='animate-spin w-8 h-8' />
          </div>
        ) : (
          <div className='flex items-center justify-start flex-nowrap whitespace-nowrap'>
            {popularSeries.map((series) => (
               <Link
                onClick={() => {
                setSeriesId(series.id)
                setSeriesTitle(series.original_title)
                setOpenSeriesModal(true)
               }} >
                <Card key={series.id} src={series.poster_path} rating={series.vote_average < 2 ? "5.2" : series.vote_average} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Series;
