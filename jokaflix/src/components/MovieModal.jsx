import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import Card from './Card';

export default function MovieModal({ toggler, title, movieCategory, onClose }) {
  const [open, setOpen] = useState(toggler);

  useEffect(() => {
    setOpen(toggler);
  }, [toggler]);

  const closeModal = () => {
    setOpen(false);
    onClose(); // Callback to notify parent about modal close
  };

  const [popularMovies, setPopularMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [coverMovie, setCoverMovie] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = Math.ceil(Math.random() * 10);
    setCoverMovie(id);

    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        await fetchMoviesByCategory(movieCategory, 5);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [movieCategory]);

  const fetchMoviesByCategory = async (category, pageCount) => {
    try {
      let allMovies = [];
      setIsLoading(true);

      for (let page = 1; page <= pageCount; page++) {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${category}?api_key=035c0f1a7347b310a5b95929826fc81f&language=en-US&page=${page}`
        );

        const moviesData = response.data.results;
        allMovies = [...allMovies, ...moviesData];
      }

      // Update state based on category
      if (category === "popular") {
        setPopularMovies((prev) => [...prev, ...allMovies]);
      } else if (category === "trending") {
        setTrendingMovies((prev) => [...prev, ...allMovies]);
      } else if (category === "upcoming") {
        setUpcomingMovies((prev) => [...prev, ...allMovies]);
      }
    } catch (error) {
      setIsLoading(false);
      console.error(`Error fetching ${category} movies:`, error);
    }
  };

  return (
    <Transition show={open}>
      <Dialog className="relative z-10" onClose={closeModal}>
        <TransitionChild
          enter="ease-in-out duration-300"
          enterFrom="absolute top-[100vh] opacity-0"
          enterTo="absolute top-0 opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div
            className="fixed top-0 left-0 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10"
            onClick={closeModal}
          >
            <XCircleIcon className="h-8 w-8 text-orange-600" aria-hidden="true" />
          </div>
          <DialogTitle
            as="h3"
            className="text-center font-semibold leading-6 mt-4 text-orange-600 text-2xl"
          >
            {title}
          </DialogTitle>
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-y-auto rounded-lg bg-transparent text-left shadow-xl transition-all w-[90vw] lg:w-[80vw] h-[95vh] lg:h-[90vh]">
                <div className="bg-transparent px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <div className="flex flex-wrap items-center justify-center mt-2 w-full">
                        {upcomingMovies.map((upcoming) => (
                          <Card key={upcoming.id} src={upcoming.poster_path} rating={upcoming.vote_average} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
