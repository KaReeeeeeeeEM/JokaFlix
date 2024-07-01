/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Card from './Card';
import PlainCard from './PlainCard';
import SingleMovieModal from './SingleMovieModal'
import CardLoader from './CardLoader';
import progress from '../assets/progress.png';

export default function MovieDescriptionTabs({ movieID }) {
  const [activeTab, setActiveTab] = useState(0);
  const [moviesByCategory, setMoviesByCategory] = useState([]);
  const [movieId, setMovieId] = useState("");
  const [trailers, setTrailers] = useState([]);
  const [movieTitle, setMovieTitle] = useState("");
  const [openMovieModal, setOpenMovieModal] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cast, setCast] = useState([]);
  const [images, setImages] = useState({ backdrops: [], posters: [] });

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [download, setDownload] = useState("");

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `https://api.themoviedb.org/3/${movieID}/images?api_key=035c0f1a7347b310a5b95929826fc81f`
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
  }, [movieID]);

  useEffect(() => {
    const fetchCast = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `https://api.themoviedb.org/3/${movieID}/credits?api_key=035c0f1a7347b310a5b95929826fc81f`
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
  }, [movieID]);

  useEffect(() => {
    const getTrailers = async () => {
      const trailerList = await fetchTrailers(movieID);
      setTrailers(trailerList);
    };

    if (activeTab === 0) {
      getTrailers();
    }
  }, [movieID, activeTab]);

  const fetchTrailers = async (movieId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`https://api.themoviedb.org/3/${movieId}/videos?api_key=035c0f1a7347b310a5b95929826fc81f`);
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
    const getRelatedMovies = async () => {
      const movies = await fetchRelatedMovies(movieID);
      setRelatedMovies(movies);
    };

    if (activeTab === 1) {
      getRelatedMovies();
      console.log(movieID);
    }
  }, [movieID, activeTab]);

  const fetchRelatedMovies = async (movieId) => {
    const response = await axios.get(`https://api.themoviedb.org/3${movieId}/similar?api_key=035c0f1a7347b310a5b95929826fc81f`);
    return response.data.results;
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        setIsLoading(true);
        const moviesByCat = await fetchMoviesByCategory(movieID);
        setMoviesByCategory(moviesByCat);
      } catch (error) {
        setIsLoading(false);
        console.error("Error fetching movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [movieID]);

  const fetchMoviesByCategory = async (id) => {
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
  ];

  const handleImageClick = (imageUrl,downloadLink) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
    setDownload(downloadLink);
  };

  const downloadImage = (url) => {
    const link = document.createElement('a');
    // link.href = download;
    link.download = download;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full md:w-[93vw] mt-10">
      <div className="border-b-2 border-orange-600">
        <ul className="flex space-x-4">
          {openMovieModal && (
            <SingleMovieModal
              toggler={openMovieModal}
              title={movieTitle}
              movieId={`/movie/${movieId}`}
              onClose={() => setOpenMovieModal(false)}
            />
          )}
          {tabs.map((tab, index) => (
            <li
              key={index}
              className={`cursor-pointer pb-2 ${activeTab === index
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
              <div key={trailer.id} className="w-[85vw] h-[200px] rounded-lg m-auto md:mx-2 mb-3 md:h-[245px] md:w-[430px]">
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
              {relatedMovies.map(movie => (
                <Link
                  key={movie.id}
                  onClick={() => {
                    setMovieId(movie.id);
                    setMovieTitle(movie.original_title);
                    setOpenMovieModal(true);
                  }}
                >
                  {movie.poster_path && movie.release_date && <Card key={movie.id} src={movie.poster_path} rating={movie.vote_average < 2 ? "5.2" : movie.vote_average} year={movie.release_date} />}
                </Link>
              ))}
            </div>
          )}
        </div>
        {activeTab === 2 && moviesByCategory.map(movie => (
          <div className='overflow-y-auto overflow-x-hidden'>
            <div className='flex justify-between items-center md:px-[4rem]'>
              <div className='ml-2 flex flex-col justify-start items-start'>
                <h1 className='text-white font-bold'>Audio Track</h1>
                <p className='text-gray-600'>{moviesByCategory.map(movie => movie.spoken_languages && movie.spoken_languages.map(language => language.name && <span className='pr-2'>{language.name}</span>))}</p>
              </div>
              <div className='ml-2 flex flex-col justify-start items-end'>
                <h1 className='text-white font-bold'>Subtitles</h1>
                <p className='text-gray-600'>{moviesByCategory.map(movie => movie.original_language && <span className='pr-2'>{movie.original_language}</span>)}</p>
              </div>
            </div>
            <div className='flex justify-between items-center mt-4 md:px-[4rem]'>
              <div className='ml-2 flex flex-col justify-start items-start text-right'>
                <h1 className='text-white font-bold'>Country</h1>
                <p className='text-gray-600'>{moviesByCategory.map(movie => movie.production_countries && movie.production_countries.map(country => country.name && <span className='pr-2'>{country.name}</span>))}</p>
              </div>
              <div className='ml-2 flex flex-col justify-start items-end'>
                <h1 className='text-white font-bold'>Year</h1>
                <p className='text-gray-600'>{moviesByCategory.map(movie => movie.release_date && <span className='pr-2'>{movie.release_date.slice(0, 4)}</span>)}</p>
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
            {images.backdrops.length >0 && <h2 className='text-center text-orange-500 font-bold mt-8 md:mt-12'>Backdrops</h2>}
              <div className='flex justify-start overflow-x-auto w-full items-center mt-4'>
                {images.backdrops.map((backdrop, index) => (
                  <img
                    key={index}
                    src={`https://image.tmdb.org/t/p/original/${backdrop.file_path}`}
                    alt="backdrop"
                    className='w-[250px] h-[150px] md:w-[400px] md:h-[250px] border-4 border-orange-400 rounded-lg mr-2'
                    onClick={() => handleImageClick(`https://image.tmdb.org/t/p/original/${backdrop.file_path}`,`${backdrop.file_path.slice(1,)}`)}
                  />
                ))}
              </div>
              {images.posters.length > 0 && <h2 className='text-center text-orange-500 font-bold mt-8 md:mt-12'>Posters</h2>}
              <div className='flex justify-start overflow-x-auto w-full items-center mt-4'>
                {images.posters.map((poster, index) => (
                  <PlainCard key={index} src={`https://image.tmdb.org/t/p/w500${poster.file_path}`} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {isImageModalOpen && (
        <div className="fixed top-[69vh] lg:top-[50vh] left-0 w-full h-full lg:h-[200vh] flex items-center justify-center bg-gray-900 bg-opacity-60 lg:bg-opacity-95 z-50">
          <div className="relative">
            <button className="absolute top-0 right-0 w-9 text-2xl" onClick={() => setIsImageModalOpen(false)}>×</button>
            <img src={selectedImageUrl} alt="Selected" className="max-w-full lg:w-[80vw] lg:h-[70vh] max-h-full" />
            <div className="text-center mt-4">
              {/* <a onClick={downloadImage} className="bg-orange-600 text-white py-2 px-4 rounded">Download</a> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
