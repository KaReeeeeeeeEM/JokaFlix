import React from 'react'
import progress from '../assets/progress.png'

const CardLoader = () => {
  return (
    <div className='flex items-center justify-center bg-gray-500 h-[15rem] w-[10rem] lg:h-[20rem] lg:w-[15rem] rounded-xl mb-4 mx-1' >
        <img src={progress} alt="progress" className='animate-spin w-8 h-8' />
    </div>
  )
}

export default CardLoader