import React from 'react'
import progress from '../assets/progress.png'

const Loading = () => {
  return (
    <div className='w-screen h-screen flex items-center justify-center text-center bg-gray-500'>
        <img src={progress} alt="progress" className='animate-spin w-8 h-8' />
    </div>
  )
}

export default Loading