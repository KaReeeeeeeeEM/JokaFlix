import React from 'react';
import imdb from '../assets/imdb.png';
import hdIcon from '../assets/hdIcon.png';
import video from '../assets/video.png';
import comingsoon from '../assets/comingsoon.png';
import star from '../assets/star.png';
import '../card.css';

const Card = ({ src, rating, category, year }) => {
  
  function determineQuality(){
    var firstDate = new Date(year)
    var secondDate = new Date();
  
    const year1 = firstDate.getFullYear();
    const month1 = firstDate.getMonth();
  
    const year2 = secondDate.getFullYear();
    const month2 = secondDate.getMonth();
  
    const monthsApart = (year2 - year1) * 12 + (month2 - month1);

    if(year1 - year2 > 0){
        return <img src={comingsoon} alt='hd' className='w-8 h-8' />
    }else if (monthsApart >= 2) {
      return <img src={hdIcon} alt='hd' className='w-4 h-4' />
    } else if (monthsApart === 1) {
      return <img src={video} alt='recorded' className='w-4 h-4' />
    } else if(year1 > "2024"){
      return <img src={video} alt='hd' className='w-4 h-4' />
    } else {
      return <img src={video} alt='hd' className='w-4 h-4' />
    }
  }
  

  return (
    <div>
      {(
        <div className='card-container' style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w500${src})` }}>
          <div className="relative top-0 h-full w-full inset-0 bg-opacity-60 bg-gray-900 blur-md"></div>
          <div className='overlay'>
            {rating && (
              <h1 className='overlay-rating flex flex-col items-center text-lg md:text-2xl'>
                <img src={star} alt="star" className='star-img w-12 h-12' />
                {rating < 1 ? '5.2 / 10' : Math.ceil(rating * 10) / 10} / 10
              </h1>
            )}
            <div className='card-category'>
              <h1 className='category-text text-orange-400 text-[1.3rem] font-bold'>{category}</h1>
            </div>
          </div>
          <div className='content'>
            <div className='flex items-center justify-start relative -top-60 md:-top-72 lg:-top-96 my-1 mx-4 w-full h-[2rem]'>
              <div className='w-1/2 flex'>
                <img src={imdb} alt='imdb' className='w-[2rem] h-[2rem] mr-1' />
                {rating && (
                  <h1 className='flex items-center md:text-lg text-white font-bold'>
                    <span className='w-6 h-4'>
                      <img src={star} alt="star" className='w-4 h-4 ml-1' />
                    </span>
                    {rating < 1 ? 5.2 : Math.ceil(rating * 10) / 10}
                  </h1>
                )}
              </div>
              <div className='w-1/2 flex justify-end pr-6 md:pr-8'>
                {year && determineQuality()}
              </div>
            </div>
            <div>
              <h1 className='relative bottom-28 md:bottom-24 uppercase text-center text-lg md:text-xl text-white font-bold'>{category}</h1>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
