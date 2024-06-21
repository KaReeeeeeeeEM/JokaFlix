import CardLoader from './CardLoader'

const Card = ({src,loading}) => {
  return (
      <div>
    {loading ? <CardLoader /> : 
     <div className='bg-white h-[15rem] w-[9.3rem] md:w-[10rem] lg:h-[20rem] lg:w-[15rem] rounded-xl mb-4 mx-1 hover:scale-105 transition ease-in-out duration-700 cursor-pointer' style={{backgroundImage:`url(https://image.tmdb.org/t/p/w500${src})`, backgroundPosition:"center", backgroundSize:"cover", backgroundRepeat:"no-repeat"}}>
      <div className="relative top-0 h-full w-full inset-0 bg-opacity-60 bg-gray-900 blur-md"></div>
     </div>}
      </div>
  )
}

export default Card