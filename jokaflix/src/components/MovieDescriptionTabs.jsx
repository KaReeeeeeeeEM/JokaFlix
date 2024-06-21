/* eslint-disable no-unused-vars */
import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Card from './Card';
import SingleMovieModal from './SingleMovieModal'

export default function MovieDescriptionTabs({movieID}) {
  const [activeTab, setActiveTab] = useState(0);
  const [moviesByCategory, setMoviesByCategory] = useState([]);
  const [movieId, setMovieId] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [openMovieModal, setOpenMovieModal] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="mt-4 p-4 rounded w-full h-[30vh] overflow-y-auto ">
        {activeTab === 0 && moviesByCategory.map(movie => movie.title)}
        
        <div className="mt-4 rounded h-[30vh] overflow-y-auto fixed">
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
          </div>
            ))}
      </div>
    </div>
  );
}
