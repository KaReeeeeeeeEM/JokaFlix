/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React,{ useState , useEffect} from 'react'
import axios from 'axios';
import Card from './Card'

const ForYou = () => {
    const [popularMovies, setPopularMovies] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [upcomingMovies, setUpcomingMovies] = useState([]);
    const [coverMovie, setCoverMovie] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

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
    <div className='flex flex-col items-left px-8 md:px-40 my-24 md:my-48 w-[95vw]'>
      <div className='flex items-center justify-between text-white font-semibold mb-8'>
          <h1 className='text-lg'>For You</h1>
          <a href='#' className='text-orange-300 text-lg'>
            See All
          </a>
      </div>
      <div className="flex overflow-x-auto w-full">
      <div className='flex items-center justify-start flex-nowrap whitespace-nowrap'>
        {upcomingMovies.map(upcoming => <Card src={upcoming.poster_path} rating={upcoming.vote_average} />)}
      </div>
      </div>
    </div>
  )
}

export default ForYou