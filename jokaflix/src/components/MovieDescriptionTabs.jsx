/* eslint-disable no-unused-vars */
import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Card from './Card';
import PlainCard from './PlainCard';
import SingleMovieModal from './SingleMovieModal'

export default function MovieDescriptionTabs({movieID}) {
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

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/${movieID}/images?api_key=035c0f1a7347b310a5b95929826fc81f`
        );
        setImages(response.data);
      } catch (error) {
        console.error('Error fetching movie images:', error);
      }
    };

    fetchImages();
  }, [movieID]);

  useEffect(() => {
    const fetchCast = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/${movieID}/credits?api_key=035c0f1a7347b310a5b95929826fc81f`
        );
        setCast(response.data.cast.filter(cast => cast.known_for_department === 'Acting'));
      } catch (error) {
        console.error('Error fetching movie cast:', error);
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
      const response = await axios.get(`https://api.themoviedb.org/3/${movieId}/videos?api_key=035c0f1a7347b310a5b95929826fc81f`);
      return response.data.results.filter(video => video.type === 'Trailer');
    } catch (error) {
      console.error('Error fetching trailers:', error);
      return [];
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
    const response = await axios.get(`https://api.themoviedb.org/3${movieID}/similar?api_key=035c0f1a7347b310a5b95929826fc81f`);
    return response.data.results;
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const moviesByCat = await fetchMoviesByCategory(movieID);
        setMoviesByCategory(moviesByCat);
      } catch (error) {
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
        console.error(`Error fetching movie:`, error);
        return [];
      }
    }
    return [];
  };

  const tabs = [
    { title: "Trailers" },
    { title: "More Like This"},
    { title: "About"},
  ];

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
          <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center justify-center md:justify-start">
            {trailers.map(trailer => (
              <div key={trailer.id} className="w-[85vw] rounded-lg m-auto mb-3 md:mx-8 md:w-[20vw]">
                <iframe
                  width="100%"
                  height="169"
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={trailer.name}
                ></iframe>
              </div>
            ))}
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
                <Card key={movie.id} src={movie.poster_path} rating={movie.vote_average < 2 ? "5.2" : movie.vote_average} />
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
                    <p className='text-gray-600'>{moviesByCategory.map(movie => movie.release_date && <span className='pr-2'>{movie.release_date.slice(0,4)}</span>)}</p>
                </div>
            </div>
            <div className=' w-[80vw] md:w-full md:px-[4rem]'>
              <h2 className='text-center text-orange-500 font-bold mt-8 md:mt-12'>Cast</h2>
              <div className='flex justify-start overflow-x-auto w-full items-center mt-4'>
                {cast.slice(0,6).map(actor => (
                  actor.profile_path && <div key={actor.cast_id} className='flex flex-col flex-wrap justify-start items-start'>
                    {actor.profile_path !== null &&<PlainCard src={`https://image.tmdb.org/t/p/w500${actor.profile_path}`} />}
                    <span className='text-white ml-2'>{actor.name}</span>
                    <span className='text-gray-500 ml-2'>{actor.gender === 2? "Actor" : "Actress"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='w-[80vw] md:w-full md:px-[4rem]'>
              <h2 className='text-center text-orange-500 font-bold mt-8 md:mt-12'>Backdrops</h2>
              <div className='flex justify-start overflow-x-auto w-full items-center mt-4'>
                {images.backdrops.map((backdrop, index) => (
                  <img
                    key={index}
                    src={`https://image.tmdb.org/t/p/original${backdrop.file_path}`}
                    alt={`Backdrop ${index + 1}`}
                    style={{ width: '200px',height: '120px', borderRadius: '1rem' , marginRight: '10px' }}
                  />
                ))}
              </div>
              <h2 className='text-center text-orange-500 font-bold mt-8 md:mt-12'>Posters</h2>
              <div className='flex justify-start overflow-x-auto w-full items-center mt-4'>
                {images.posters.map((poster, index) => (
                  <img
                    key={index}
                    src={`https://image.tmdb.org/t/p/original${poster.file_path}`}
                    alt={`Poster ${index + 1}`}
                    style={{ width: '150px',height: '200px', borderRadius: '1rem' , marginRight: '10px' }}
                  />
                ))}
              </div>
            </div>
          </div>
            ))}
      </div>
    </div>
  );
}
