import React from 'react'
import imdb from '../assets/imdb.png'

const Card = () => {
  return (
    <div className='bg-white h-[15rem] w-[10rem] lg:h-[20rem] lg:w-[15rem] rounded-xl mb-4 mx-1'>
      <div className="relative top-0 h-full w-full inset-0 bg-opacity-60 bg-gray-900 blur-md"></div>
      <div className='flex items-center justify-around relative -top-60 lg:-top-80 p-2 m-2 w-[8rem] h-[2rem]'>
          <img src={imdb} alt='imdb' className='w-[3rem] h-[3rem]' />
          <h1 className='text-xl text-white font-semibold'>IMDB</h1>
      </div>
    </div>
  )
}

export default Card