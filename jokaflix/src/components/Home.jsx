/* eslint-disable no-unused-vars */
import React,{ useState, useEffect } from 'react'
import {useParams} from 'react-router-dom';
import Profile from './Profile'
import Showcase from './Showcase'
import ForYou from './ForYou'
import axios from 'axios'
import Loading from './Loading'
import imdb from '../assets/imdb.png'
import star from '../assets/star.png'
import search from '../assets/search.png'
import MovieModal from './MovieModal';

const Home = () => {
    const [popularMovies, setPopularMovies] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [upcomingMovies, setUpcomingMovies] = useState([]);
    const [coverMovie, setCoverMovie] = useState(0);
    const [username, setUsername] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [openSearch, setOpenSearch] = useState(false);
    const urlSearchParams = new URLSearchParams(window.location.search);
    const profilePicture = urlSearchParams.get("profile");
    const { user } = useParams();


   
    // useEffect(() => {
    //     if (user) {
    //       setUsername(user);
    //     } else {
    //       setUsername(username);
    //     }
    
    //     if (profilePicture) {
    //       setProfile(profilePicture);
    //     } else {
    //       setProfile(profile);
    //     }
    //   }, [user, profilePicture]);

    useEffect(() => {
        const id = Math.ceil(Math.random() * 10)
        setCoverMovie(id);

        const fetchMovies = async () => {
          try {
            setIsLoading(true);
            await fetchMoviesByCategory("popular", 5);
            await fetchMoviesByCategory("top_rated", 5);
            await fetchMoviesByCategory("upcoming", 5);
          } catch (error) {
            setIsLoading(false);
            console.error("Error fetching movies:", error);
          }finally{
            setIsLoading(false);
          }
        };
      
        fetchMovies();
      }, []);
      
      const fetchMoviesByCategory = async (category, pageCount) => {
        try {
          let allMovies = [];
          setIsLoading(true)
          
          for (let page = 1; page <= pageCount; page++) {
            const response = await axios.get(
              `https://api.themoviedb.org/3/movie/${category}?api_key=035c0f1a7347b310a5b95929826fc81f&language=en-US&page=${page}`
            );
           
            const moviesData = response.data.results;
            allMovies = [...allMovies, ...moviesData];
          }
      
          // Update state based on category
          if (category === "popular") {
            setPopularMovies((prev) => [...prev, ...allMovies]);
          } else if (category === "trending") {
            setTrendingMovies((prev) => [...prev, ...allMovies]);
          } else if (category === "upcoming") {
            setUpcomingMovies((prev) => [...prev, ...allMovies]);
          }
        } catch (error) {
          setIsLoading(false)
          console.error(`Error fetching ${category} movies:`, error);
        }
      };  

  return (
    <>
        { isLoading ? <Loading /> : (
            <div className='overflow-y-auto bg-gray-900'>
            {openSearch && (
                <MovieModal
                toggler={openSearch}
                title="Search"
                type="search"
                searchParam="House"
                onClose={() => setOpenSearch(false)}
                />
      )}
            <div className='w-full h-screen bg-gray-900' style={{backgroundImage:`url(https://image.tmdb.org/t/p/original${upcomingMovies[coverMovie].poster_path || upcomingMovies[coverMovie].backdrop_path})`, backgroundPosition:"center", backgroundSize:"cover", backgroundRepeat:"no-repeat"}}>
                <div className="absolute top-0 h-full w-full inset-0 bg-opacity-60 bg-black blur-md"></div>
            {/* <div className="absolute bottom-0 h-1/6 w-full inset-0 bg-opacity-60 bg-gray-900 blur-md"></div> */}
                <div className='flex items-center justify-around absolute top-[60vh] md:top-[65vh] lg:top-[55vh] left-[1.2rem] lg:left-[2.5rem] p-2 w-[8rem] h-[2rem]'>
                    <img src={imdb} alt='imdb' className='w-[3rem] h-[3rem]' />
                    <h1 className='flex text-xl text-white font-semibold'><span className='mx-1'><img src={star} alt="star" className='w-6 h-6' /></span>{upcomingMovies[coverMovie].vote_average < 1 ? 5.5 : Math.ceil(upcomingMovies[coverMovie].vote_average * 10 )/10}</h1>
                </div>
                <div className=' w-full h-4 px-8 my-6 flex justify-between items-center absolute top-0 right-0 z-30'>
                    <h1 className='text-xl md:text-3xl text-white'>Joka<span className='text-orange-400'>Flix</span></h1>
                    <div className='flex items-center justify-between w-[6rem] lg:w-[8rem]'>
                        <button onClick={() => setOpenSearch(true)}>
                            <img src={search} alt='search' className='rounded-full w-6 h-6 md:w-8 md:h-8' />
                        </button>
                         <Profile/>
                    </div>
                </div>
                <div className='w-full px-8 lg:px-12 absolute top-[65vh] md:top-[70vh] lg:top-[60vh] flex flex-col justify-between items-left'>
                    <h1 className='text-3xl md:text-4xl text-orange-400 font-extrabold'>{upcomingMovies[coverMovie].original_title }</h1>
                    <h2 className='text-md text-gray-300 font-semibold md:w-1/2'>
                       {(upcomingMovies[coverMovie].overview).length > 50 ? (upcomingMovies[coverMovie].overview).slice(0,100) + " ... " : upcomingMovies[coverMovie].overview }
                    </h2>
                </div>
                <div className='w-full px-8 md:px-12 absolute top-[80vh] md:top-[80vh] lg:top-[80vh] flex items-center lg:text-lg'>
                        <button className='py-2 px-4 md:py-4 md:px-16 bg-orange-500 text-white font-semibold rounded-full flex hover:opacity-65 transition ease-in-out duration-700'>
                            <span className='px-2'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            </span>
                            Watch Now
                        </button>
                        <h2 className='text-2xl text-white mx-4'> | </h2>
                        <button className='py-2 px-4 mx-4 md:py-4 md:px-4 bg-orange-400 text-white font-semibold rounded-full hover:opacity-65 transition ease-in-out duration-700'>
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
            <div>
                <ForYou />
            </div>
            
        </div>)}
     </>
  )
}

export default Home