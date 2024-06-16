import React from 'react'
import imdb from '../assets/imdb.png'
import star from '../assets/star.png'
import CardLoader from './CardLoader'

const Card = ({src,rating,loading}) => {
  return (
      <div>
    {loading ? <CardLoader /> : 
     <div className='bg-white h-[15rem] w-[10rem] lg:h-[20rem] lg:w-[15rem] rounded-xl mb-4 mx-1 hover:scale-105 transition ease-in-out duration-700 cursor-pointer' style={{backgroundImage:`url(https://image.tmdb.org/t/p/w500${src})`, backgroundPosition:"center", backgroundSize:"cover", backgroundRepeat:"no-repeat"}}>
      <div className="relative top-0 h-full w-full inset-0 bg-opacity-60 bg-gray-900 blur-md"></div>
        <div className='flex items-center justify-around relative -top-60 lg:-top-80 p-2 m-2 w-[8rem] h-[2rem]'>
            <img src={imdb} alt='imdb' className='w-[3rem] h-[3rem]' />
            <h1 className='flex items-center text-xl text-white font-semibold'><span className='mx-1'><img src={star} alt="star" className='w-6 h-6' /></span>{rating < 1 ? 5.2 : Math.ceil(rating * 10)/10}</h1>
        </div>
     </div>}
      </div>
  )
}

export default Card