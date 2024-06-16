/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import Card from './Card'

const ForYou = () => {
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
        <Card />
        <Card />
        <Card />
        <Card />
        <Card />
        <Card />
        <Card />
        <Card />
      </div>
      </div>
    </div>
  )
}

export default ForYou