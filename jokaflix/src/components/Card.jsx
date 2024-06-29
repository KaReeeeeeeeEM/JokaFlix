import React from 'react';
import imdb from '../assets/imdb.png';
import star from '../assets/star.png';
import CardLoader from './CardLoader';
import '../card.css';

const Card = ({ src, rating, loading, category }) => {
  return (
    <div>
      {loading ? (
        <div className="card-placeholder">
          <div className="card-placeholder-image"></div>
          <div className="card-placeholder-content">
            <div className="card-placeholder-rating"></div>
            <div className="card-placeholder-category"></div>
          </div>
        </div>
      ) : (
        <div className='card-container' style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w500${src})` }}>
          <div className="relative top-0 h-full w-full inset-0 bg-opacity-60 bg-gray-900 blur-md"></div>
          <div className='overlay'>
            {rating && (
              <h1 className='overlay-rating flex flex-col items-center text-lg md:text-2xl'><img src={star} alt="star" className='star-img w-12 h-12' />{rating < 1 ? '5.2 / 10' : Math.ceil(rating * 10) / 10} / 10</h1>
            )}
            <div className='card-category'>
              <h1 className='category-text text-orange-400 text-[1.3rem] font-bold'>{category}</h1>
            </div>
          </div>
          <div className='content'>
            <div className='flex items-center justify-start relative -top-60 md:-top-72 lg:-top-96 my-1 mx-4 w-[6rem] h-[2rem]'>
              <img src={imdb} alt='imdb' className='w-[2rem] h-[2rem] mr-1' />
              {rating && <h1 className='flex items-center text-lg text-white font-bold'><span className='w-6 h-4'><img src={star} alt="star" className='w-4 h-4 ml-1' /></span>{rating < 1 ? 5.2 : Math.ceil(rating * 10)/10}</h1>}
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
