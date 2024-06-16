import React from 'react'
import Profile from './Profile'
import Showcase from './Showcase'
import imdb from '../assets/imdb.png'

const Home = () => {
  return (
    <div className='overflow-y-auto bg-gray-900'>
        <div className='w-full h-screen bg-gray-900' style={{backgroundImage:"url(https://mcdn.wallpapersafari.com/medium/71/33/DMbmeR.jpg)", backgroundPosition:"center", backgroundSize:"cover", backgroundRepeat:"no-repeat"}}>
        {/* <div className="absolute bottom-0 h-1/6 w-full inset-0 bg-opacity-60 bg-gray-900 blur-md"></div> */}
            <div className="absolute top-0 h-full w-full inset-0 bg-opacity-60 bg-black blur-md"></div>
            <div className=' w-full h-4 px-8 my-6 flex justify-between items-center absolute top-0 right-0 z-30'>
                <h1 className='text-xl md:text-3xl text-white'>Joka<span className='text-orange-400'>Flix</span></h1>
                <Profile/>
            </div>
            <div className='w-full px-8 lg:px-12 absolute top-[60vh] md:top-[40vh] lg:top-[60vh] flex flex-col justify-between items-left'>
                <h1 className='text-3xl md:text-4xl text-orange-400 font-extrabold'>JokaFlix</h1>
                <h2 className='text-md text-gray-300 font-semibold md:w-1/2'>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. 
                    Repellat distinctio fugiat labore fugit quasi deleniti accusamus 
                    saepe in vitae sed iure quas quisquam officiis, natus quis eveniet 
                    placeat ipsa dolor?
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
                    <button className='py-2 px-4 mx-4 md:py-4 md:px-4 bg-gray-500 text-white font-semibold rounded-full hover:opacity-65 transition ease-in-out duration-700'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
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
        
    </div>
  )
}

export default Home