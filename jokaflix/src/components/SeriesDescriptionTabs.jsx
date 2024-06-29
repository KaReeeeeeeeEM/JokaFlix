/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Card from './Card';
import PlainCard from './PlainCard';
import SingleSeriesModal from './SingleSeriesModal';
import ImagePreviewModal from './ImagePreviewModal';  // Import the new modal
import CardLoader from './CardLoader';
import progress from '../assets/progress.png';

export default function SeriesDescriptionTabs({ seriesID }) {
  const [activeTab, setActiveTab] = useState(0);
  const [seriesByCategory, setSeriesByCategory] = useState([]);
  const [seriesId, setSeriesId] = useState("");
  const [trailers, setTrailers] = useState([]);
  const [seriesTitle, setSeriesTitle] = useState("");
  const [openSeriesModal, setOpenSeriesModal] = useState(false);
  const [relatedSeries, setRelatedSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cast, setCast] = useState([]);
  const [images, setImages] = useState({ backdrops: [], posters: [] });

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `https://api.themoviedb.org/3/${seriesID}/images?api_key=035c0f1a7347b310a5b95929826fc81f`
        );
        setImages(response.data);
      } catch (error) {
        setIsLoading(false);
        console.error('Error fetching movie images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [seriesID]);

  useEffect(() => {
    const fetchCast = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `https://api.themoviedb.org/3/${seriesID}/credits?api_key=035c0f1a7347b310a5b95929826fc81f`
        );
        setCast(response.data.cast.filter(cast => cast.known_for_department === 'Acting'));
      } catch (error) {
        setIsLoading(false);
        console.error('Error fetching movie cast:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCast();
  }, [seriesID]);

  useEffect(() => {
    const getTrailers = async () => {
      const trailerList = await fetchTrailers(seriesID);
      setTrailers(trailerList);
    };

    if (activeTab === 0) {
      getTrailers();
    }
  }, [seriesID, activeTab]);

  const fetchTrailers = async (seriesId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`https://api.themoviedb.org/3/${seriesId}/videos?api_key=035c0f1a7347b310a5b95929826fc81f`);
      return response.data.results.filter(video => video.type === 'Trailer');
    } catch (error) {
      setIsLoading(false);
      console.error('Error fetching trailers:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getRelatedSeries = async () => {
      const movies = await fetchRelatedSeries(seriesID);
      setRelatedSeries(movies);
    };

    if (activeTab === 1) {
      getRelatedSeries();
      console.log(seriesID);
    }
  }, [seriesID, activeTab]);

  const fetchRelatedSeries = async (seriesId) => {
    const response = await axios.get(`https://api.themoviedb.org/3${seriesId}/similar?api_key=035c0f1a7347b310a5b95929826fc81f`);
    return response.data.results;
  };

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setIsLoading(true);
        setIsLoading(true);
        const seriesByCat = await fetchSeriesByCategory(seriesID);
        setSeriesByCategory(seriesByCat);
      } catch (error) {
        setIsLoading(false);
        console.error("Error fetching series:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeries();
  }, [seriesID]);

  const fetchSeriesByCategory = async (id) => {
    if (id != null) {
      try {
        setIsLoading(true);
        let movieDetails = [];
        setIsLoading(true);
        const response = await axios.get(
          `https://api.themoviedb.org/3${id}?api_key=035c0f1a7347b310a5b95929826fc81f`
        );
        const moviesData = response.data;
        movieDetails = [moviesData];
        return movieDetails;
      } catch (error) {
        setIsLoading(false);
        setIsLoading(false);
        console.error(`Error fetching movie:`, error);
        return [];
      } finally {
        setIsLoading(false);
      }
    }
    return [];
  };

  const tabs = [
    { title: "Trailers" },
    { title: "More Like This" },
    { title: "About" },
    { title: "Seasons" }
  ];

  const handleImageClick = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  return (
    <div className="w-full md:w-[93vw] mt-10">
      <div className="border-b-2 border-orange-600">
        <ul className="flex space-x-4">
          {openSeriesModal && (
            <SingleSeriesModal
              toggler={openSeriesModal}
              title={seriesTitle}
              movieId={`/tv/${seriesID}`}
              onClose={() => setOpenSeriesModal(false)}
            />
          )}
          {tabs.map((tab, index) => (
            <li
              key={index}
              className={`cursor-pointer pb-2 ${
                activeTab === index
                  ? 'border-b-4 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-orange-600'
              }`}
              onClick={() => setActiveTab(index)}
            >
              {tab.title}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 p-4 rounded w-full h-[50vh] overflow-y-auto ">
      {activeTab === 0 && (
          <div className="flex flex-col md:flex-row md:flex-wrap items-start md:items-center justify-center md:justify-start">
            {trailers.length > 0 ? 
            trailers.map(trailer => (
              <div key={trailer.id} className="w-[85vw] h-[200px] rounded-lg m-auto md:mx-2 mb-3 md:h-[250px] md:w-[450px]">
                <iframe
                  width="100%"
                  height="100%"
                  className='rounded-lg'
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={trailer.name}
                ></iframe>
              </div>
            ) 
              )  :
              <div className='w-full h-full m-auto text-left'>
                  <h1 className='font-bold text-orange-600'>No Trailers available</h1>
              </div>
          }
          </div>
        )}

        <div className="mt-4 rounded h-[50vh] overflow-y-auto fixed">
          {activeTab === 1 && (
            <div className="flex flex-wrap items-center justify-center">
              {isLoading ? (
                <div className="flex items-center justify-center bg-transparent w-full h-full rounded-xl mb-4 mx-1">
                  <img src={progress} alt="progress" className="animate-spin w-8 h-8" />
                </div>
              ): relatedSeries.map(movie => (
                <Link
                  key={movie.id}
                  onClick={() => {
                    setSeriesId(movie.id);
                    setSeriesTitle(movie.original_title);
                    setOpenSeriesModal(true);
                  }}
                >
                  <Card key={movie.id} src={movie.poster_path} rating={movie.vote_average < 2 ? "5.2" : movie.vote_average} />
                </Link>
              ))}
            </div>
          )}
        </div>
        {activeTab === 2 && seriesByCategory.map(movie => (
          <div className='overflow-y-auto overflow-x-hidden'>
            <div className='flex justify-between items-center md:px-[4rem]'>
              <div className='ml-2 flex flex-col justify-start items-start'>
                <h1 className='text-white font-bold'>Audio Track</h1>
                <p className='text-gray-600'>{seriesByCategory.map(movie => movie.spoken_languages && movie.spoken_languages.map(language => language.name && <span className='pr-2'>{language.name}</span>))}</p>
              </div>
              <div className='ml-2 flex flex-col justify-start items-end'>
                <h1 className='text-white font-bold'>Subtitles</h1>
                <p className='text-gray-600'>{seriesByCategory.map(movie => movie.original_language && <span className='pr-2'>{movie.original_language}</span>)}</p>
              </div>
            </div>
            <div className='flex justify-between items-center mt-4 md:px-[4rem]'>
              <div className='ml-2 flex flex-col justify-start items-start text-right'>
                <h1 className='text-white font-bold'>Country</h1>
                <p className='text-gray-600'>{seriesByCategory.map(movie => movie.production_countries && movie.production_countries.map(country => country.name && <span className='pr-2'>{country.name}</span>))}</p>
              </div>
              <div className='ml-2 flex flex-col justify-start items-end'>
                <h1 className='text-white font-bold'>Production</h1>
                <p className='text-gray-600'>{seriesByCategory.map(movie => movie.first_air_date && <span className='pr-2'>{movie.first_air_date.slice(0, 4) + " - " + movie.last_air_date.slice(0, 4)}</span>)}</p>
              </div>
            </div>
            <div className='flex justify-between items-center mt-4 md:px-[4rem]'>
              <div className='ml-2 flex flex-col justify-start items-start text-right'>
                <h1 className='text-white font-bold'>Episodes</h1>
                <p className='text-gray-600'>{seriesByCategory.map(movie => movie.number_of_episodes && movie.number_of_episodes + " episodes")}</p>
              </div>
              <div className='ml-2 flex flex-col justify-start items-end'>
                <h1 className='text-white font-bold'>Status</h1>
                <p className='text-gray-600'>{seriesByCategory.map(movie => movie.status && <span className='pr-2'>{movie.status}</span>)}</p>
              </div>
            </div>
            <div className=' w-[80vw] md:w-full md:px-[4rem]'>
              <h2 className='text-center text-orange-500 font-bold mt-8 md:mt-12'>Cast</h2>
              {isLoading ? (
                <div className='flex items-center justify-center bg-transparent h-[15rem] w-full lg:h-[20rem]'>
                  <img src={progress} alt="progress" className='animate-spin w-8 h-8' />
                </div>
              )
                : (
                  <div className='flex justify-start overflow-x-auto w-full items-center mt-4'>
                    {cast.map(actor => (
                      actor.profile_path !== null && <div key={actor.cast_id} className='flex flex-col flex-wrap justify-start items-start'>
                        {actor.profile_path !== null && <PlainCard src={`https://image.tmdb.org/t/p/w500${actor.profile_path}`} />}
                        <span className='text-white ml-2'>{actor.name}</span>
                        <span className='text-gray-500 ml-2'>{actor.gender === 2 ? "Actor" : "Actress"}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <div className='w-[80vw] md:w-full md:px-[4rem]'>
              <h2 className='text-center text-orange-500 font-bold mt-8 md:mt-12'>Backdrops</h2>
              <div className='flex justify-start overflow-x-auto w-full items-center mt-4'>
                {images.backdrops.map((backdrop, index) => (
                  <img
                    key={index}
                    src={`https://image.tmdb.org/t/p/original/${backdrop.file_path}`}
                    alt="backdrop"
                    className='w-[250px] h-[150px] md:w-[400px] md:h-[250px] border-4 border-orange-400 rounded-lg mr-2'
                    onClick={() => handleImageClick(`https://image.tmdb.org/t/p/original/${backdrop.file_path}`)}
                  />
                ))}
              </div>
              <h2 className='text-center text-orange-500 font-bold mt-8 md:mt-12'>Posters</h2>
              <div className='flex justify-start overflow-x-auto w-full items-center mt-4'>
                {images.posters.map((poster, index) => (
                  <PlainCard
                    key={index}
                    src={`https://image.tmdb.org/t/p/w500${poster.file_path}`}
                    onClick={() => handleImageClick(`https://image.tmdb.org/t/p/original${poster.file_path}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
        {activeTab === 3 && (
          <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center justify-center md:justify-start">
            {seriesByCategory.map((season, index) => (
              <div key={index} className="w-[85vw] md:flex md:w-full md:justify-start md:overflow-x-auto rounded-lg m-auto mb-3 md:mx-8">
                {season.seasons !== null && season.seasons.map(poster =>
                  poster.poster_path !== null &&
                  (<div className='flex flex-col justify-start items-start mr-2'>
                    <div key={poster.id} style={{ background: `url(https://image.tmdb.org/t/p/original${poster.poster_path})`, backgroundPosition: "center", backgroundSize: "cover" }} alt="poster" className='w-full h-[200px] md:w-[400px] md:h-[250px] rounded-lg mr-2'></div>
                    <h1 className='font-bold text-white'>{poster.name + (poster.air_date !== null ? (" | " + poster.air_date.slice(0, 4)) : " ")}</h1>
                    <p className='mb-8 text-gray-600'>{poster.episode_count + " episodes"}</p>
                  </div>)
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {isImageModalOpen && (
        <div className="fixed top-[69vh] lg:top-[60vh] left-0 w-full h-full lg:h-[200vh] flex items-center justify-center bg-gray-900 bg-opacity-60 lg:bg-opacity-95 z-50">
          <div className="relative">
            <button className="absolute top-0 right-0 text-black w-9 text-2xl" onClick={() => setIsImageModalOpen(false)}>×</button>
            <img src={selectedImageUrl} alt="Selected" className="max-w-full lg:w-[80vw] lg:h-[70vh] max-h-full" />
            <div className="text-center mt-4">
              {/* <a href='#' download className="bg-orange-600 text-white py-2 px-4 rounded">Download</a> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
