import { useParams } from 'react';

const MoviePlayer = () => {
  const { vidId } = useParams();
  console.log(vidId);
  
  if (!vidId) {
    return <div>Unable to fetch streaming link.</div>;
  }

  return (
    <div className="flex items-center justify-center h-screen w-full bg-black">
      <iframe
        src={`https://vidsrc.xyz/embed/movie/${vidId}`}
        frameBorder="0"
        allowFullScreen
        title="Vidsrc Player"
        width="100vw"
        height="100vh"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        className="w-full h-[50vh] sm:h-[60vh] md:h-[75vh] lg:h-screen"
      ></iframe>
    </div>
  );
};

export default MoviePlayer;
