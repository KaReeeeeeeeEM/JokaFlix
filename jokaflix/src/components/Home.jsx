/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Loading from './Loading';
import imdb from '../assets/imdb.png';
import star from '../assets/star.png';
import search from '../assets/search.png';
import MovieModal from './MovieModal';
import Showcase from './Showcase';
import ForYou from './ForYou';
import Categories from './Categories';
import NowPlaying from './NowPlaying';
import Popular from './Popular';
import Series from './Series';
import DownloadModal from './DownloadModal';
import MediaPlayer from './MediaPlayer';
import Joyride from 'react-joyride';
import QRCode from './QRCode';
import logo from '../assets/logo-sub.png';
import IntroAnimation from './IntroAnimation';

const Home = () => {
  const [popularMovies, setPopularMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [coverMovie, setCoverMovie] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [openSearch, setOpenSearch] = useState(false);
  const [openQRCode, setOpenQRCode] = useState(false);
  const urlSearchParams = new URLSearchParams(window.location.search);
  const [downloadTitle, setDownloadTitle] = useState(null);
  const [openDownloadModal, setOpenDownloadModal] = useState(false);
  const [openMediaPlayer, setOpenMediaPlayer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);


  const steps = [
    {
      target: '.my-first-step',
      content: 'Welcome to Jokaflix 👋, a seamless streaming platform! Care to take a short tour?',
    },
    {
      target: '.my-second-step',
      content: 'Search for any movie and get related content by clicking the search icon.',
    },
    {
      target: '.share-content',
      content: 'Easily share content by allowing friends to scan the QR Code and get access to free content.',
    },
    {
      target: '.my-third-step',
      content: 'Stream popular movies displayed on the landing section with a simple click!',
    },
    {
      target: '.my-fourth-step',
      content: 'Download your favourite movies and series easily with a single tap!',
    },
    {
      target: '.my-fifth-step',
      content: 'Check out all movies that are suggested for you including the hottest and upcoming movies',
    },
  ];

  useEffect(() => {
    const id = Math.ceil(Math.random() * 10);
    setCoverMovie(id);

    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        await fetchMoviesByCategory('popular', 5);
        await fetchMoviesByCategory('top_rated', 5);
        await fetchMoviesByCategory('upcoming', 5);
      } catch (error) {
        setIsLoading(false);
        console.error('Error fetching movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();

    // Check if onboarding has been shown
    if (!localStorage.getItem('onboardingShown')) {
      setIsVisible(true);
      localStorage.setItem('onboardingShown', 'true');
    }
  }, []);

  const fetchMoviesByCategory = async (category, pageCount) => {
    try {
      let allMovies = [];
      setIsLoading(true);

      for (let page = 1; page <= pageCount; page++) {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${category}?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US&page=${page}`
        );

        const moviesData = response.data.results;
        allMovies = [...allMovies, ...moviesData];
      }

      // Update state based on category
      if (category === 'popular') {
        setPopularMovies((prev) => [...prev, ...allMovies]);
      } else if (category === 'trending') {
        setTrendingMovies((prev) => [...prev, ...allMovies]);
      } else if (category === 'upcoming') {
        setUpcomingMovies((prev) => [...prev, ...allMovies]);
      }
    } catch (error) {
      setIsLoading(false);
      console.error(`Error fetching ${category} movies:`, error);
    }
  };

  return (
    <>
      {isLoading ? <IntroAnimation /> : (
        <div className='overflow-y-auto bg-gray-900'>
         {isVisible && <Joyride
            steps={steps}
            continuous={true}
            showSkipButton={true}
            styles={{
              options: {
                arrowColor: '#e57300',
                backgroundColor: '#111827',
                overlayColor: 'rgba(0, 0, 0, 0.8)',
                primaryColor: '#e57300',
                textColor: '#ffffff',
                width: 300,
                zIndex: 1000,
              },
            }}
          />}
          {openDownloadModal && (
            <DownloadModal
              toggler={openDownloadModal}
              title={downloadTitle}
              onClose={() => setOpenDownloadModal(false)}
            />
          )}
          {openSearch && (
            <MovieModal
              toggler={openSearch}
              title="Search"
              type="search"
              searchParam="House"
              onClose={() => setOpenSearch(false)}
            />
          )}
          {openMediaPlayer && (
            <MediaPlayer
              toggler={openMediaPlayer}
              movieTitle={popularMovies[coverMovie].original_title}
              movieId={popularMovies[coverMovie].id}
              onClose={() => setOpenMediaPlayer(false)}
            />
          )}
          {openQRCode && (
            <QRCode
              toggler={openQRCode}
              onClose={() => setOpenQRCode(false)}
            />
          )}
          <div className="absolute top-0 h-screen w-full inset-0 bg-opacity-60 bg-black blur-md"></div>
          <div className='w-full h-screen bg-gray-900' style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${popularMovies[coverMovie].poster_path || popularMovies[coverMovie].backdrop_path})`, backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}>
            <div className='flex items-center justify-around absolute top-[60vh] md:top-[65vh] lg:top-[55vh] left-[1.2rem] lg:left-[2.5rem] p-2 w-[8rem] h-[2rem]'>
              <img src={imdb} alt='imdb' className='w-[3rem] h-[3rem]' />
              <h1 className='flex text-xl text-white font-semibold'><span className='mx-1'><img src={star} alt="star" className='w-6 h-6' /></span>{popularMovies[coverMovie].vote_average < 1 ? 5.5 : Math.ceil(popularMovies[coverMovie].vote_average * 10) / 10}</h1>
            </div>
            <div className='w-full h-4 px-8 my-6 flex justify-between items-center absolute top-0 right-0 z-30'>
              <img src={logo} alt='logo' className='my-first-step w-16 h-16 md:w-32 md:h-32 mt-8  md:mt-12' />
              <div className='flex items-center justify-between w-[2rem] lg:w-[4rem] mr-4'>
                <button onClick={() => setOpenSearch(true)}>
                  <img src={search} alt='search' className='my-second-step absolute rounded-full w-6 h-6 md:w-8 md:h-8' />
                </button>
                <button onClick={() => setOpenQRCode(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="orange" className="share-content size-6 absolute rounded-full w-6 h-6 md:w-8 md:h-8 mr-8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className='w-full px-8 lg:px-12 absolute top-[65vh] md:top-[70vh] lg:top-[60vh] flex flex-col justify-between items-left'>
              <h1 className='text-3xl md:text-4xl text-orange-400 font-extrabold'>{popularMovies[coverMovie].original_title}</h1>
              <h2 className='text-md text-gray-300 font-semibold md:w-1/2'>
                {(popularMovies[coverMovie].overview).length > 20 ? (popularMovies[coverMovie].overview).slice(0, 50) + " ... " : popularMovies[coverMovie].overview}
              </h2>
            </div>
            <div className='w-full px-8 md:px-12 absolute top-[80vh] md:top-[80vh] lg:top-[80vh] flex items-center lg:text-lg'>
              <button onClick={() => setOpenMediaPlayer(true)} className='my-third-step py-2 pl-4 md:py-4 md:px-16 pr-6 bg-orange-500 text-white font-semibold rounded-full flex hover:opacity-65 transition ease-in-out duration-700'>
                <span className='px-2'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                </span>
                Watch Now
              </button>
              <h2 className='text-2xl text-white mx-4'> | </h2>
              <button onClick={() => {
                setDownloadTitle(popularMovies[coverMovie].original_title);
                setOpenDownloadModal(true);
              }} className='my-fourth-step py-2 px-4 mx-4 md:py-4 md:px-4 bg-orange-400 text-white font-semibold rounded-full hover:opacity-65 transition ease-in-out duration-700'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            </div>
          </div>
          <div className='flex items-center justify-center h-16 md:h-24 my-12 w-[20vw] md:w-[8vw] m-auto'>
            <img src={imdb} alt="imdb-icon" className='w-full h-full' />
          </div>
          <div>
            <Showcase />
          </div>
          <div className='my-fifth-step'>
            <ForYou />
          </div>
          <div className='my-sixth-step'>
            <Categories />
          </div>
          <div className='my-seventh-step'>
            <NowPlaying />
          </div>
          <div className='my-eigth-step'>
            <Popular />
          </div>
          <span className='my-last-step ml-8'></span>
          <div className='my-ninth-step'>
            <Series />
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
