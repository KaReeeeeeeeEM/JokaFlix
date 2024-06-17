/* eslint-disable no-unused-vars */
import Card from './Card'
import React, { useRef, useState, useEffect } from 'react';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import Loading from './Loading'
import axios from 'axios'

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

import '../slider.css';

// import required modules
import {  Autoplay, Navigation, Pagination } from 'swiper/modules';

const Showcase = () => {
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
    <div>
        <div className='flex flex-col md:flex-row items-center h-[5rem] md:h-[15rem] my-12 w-[90vw] md:w-[80vw] m-auto'>
                <Swiper
                slidesPerView={"auto"}
                spaceBetween={30}
                // navigation={true}
                loop={true}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                  }}
                pagination={{
                clickable: true,
                }}
                modules={[Autoplay]}
                className="mySwiper"
            >
                {popularMovies.map(popular => 
                <SwiperSlide>
                  <img src={`https://image.tmdb.org/t/p/original/${popular.backdrop_path || popular.backdrop_path}}`} alt="poster" className='w-full h-full border-4 border-orange-400 rounded-lg' />
                </SwiperSlide>)}
            </Swiper>
        </div>
    </div>
  )
}

export default Showcase