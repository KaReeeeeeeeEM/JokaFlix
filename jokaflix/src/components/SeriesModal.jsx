/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import Card from './Card';
import SingleSeriesModal from './SingleSeriesModal';
import { Link } from 'react-router-dom';

export default function SeriesModal({ toggler, title, seriesCategory, onClose }) {
  const [open, setOpen] = useState(toggler); 
  const [seriesByCategory, setSeriesByCategory] = useState([]);
  const [seriesId, setSeriesId] = useState("");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [openSeriesModal, setOpenSeriesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setOpen(toggler); 
  }, [toggler]);

  const closeModal = () => {
    setOpen(false); 
    onClose(); 
  };

  const openModal = () => {
    setOpen(true); 
  };

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setIsLoading(true);
        const seriesByCat = await fetchSeriesByCategory(seriesCategory, 10);
        setSeriesByCategory(seriesByCat);
      } catch (error) {
        console.error("Error fetching series:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeries();
  }, [seriesCategory]);    

  const fetchSeriesByCategory = async (category, pageCount) => {
    if (category != null) {
      try {
        let allSeries = [];
        setIsLoading(true);
        for (let page = 1; page <= pageCount; page++) {
          const response = await axios.get(
            `https://api.themoviedb.org/3${category}?api_key=035c0f1a7347b310a5b95929826fc81f&language=en-US&page=${page}`
          );
          const seriesData = response.data.results;
          allSeries = [...allSeries, ...seriesData];
        }
        return allSeries;
      } catch (error) {
        setIsLoading(false);
        console.error(`Error fetching ${category} Series:`, error);
        return [];
      }
    }
    return [];
  };  

  return (
    <Transition show={open} as={React.Fragment}>
      <Dialog className="relative z-50" onClose={closeModal}>
        <Transition.Child
          enter="ease-in-out duration-300"
          enterFrom="absolute top-[100vh] opacity-0"
          enterTo="absolute top-0 opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          as={React.Fragment}
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div
            className="fixed top-0 left-0 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 cursor-pointer"
            onClick={closeModal}
          >
            <XCircleIcon className="h-8 w-8 text-orange-600" aria-hidden="true" />
          </div>
          <Dialog.Title
            as="h3"
            className="text-center font-semibold leading-6 mt-4 text-orange-600 text-2xl"
          >
            {title}
          </Dialog.Title>
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              as={React.Fragment}
            >
              <Dialog.Panel className="relative transform overflow-y-auto rounded-lg bg-transparent text-left shadow-xl transition-all w-[90vw] lg:w-[80vw] h-[95vh] lg:h-[90vh]">
                {openSeriesModal && (
                  <SingleSeriesModal
                    toggler={openSeriesModal}
                    title={seriesTitle}
                    seriesId={`/tv/${seriesId}`}
                    onClose={() => setOpenSeriesModal(false)}
                  />
                )}
                <div className="bg-transparent px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <div className="flex flex-wrap items-center justify-center mt-2 w-full">
                        {seriesByCategory.map((result) => (
                          (result.poster_path === null && result.backdrop_path === null) ?
                            ""
                            :
                            <Link
                              onClick={() => {
                                setSeriesId(result.id);
                                setSeriesTitle(result.original_title);
                                setOpenSeriesModal(true);
                              }}
                              key={result.id}
                            >
                              <Card
                                src={result.poster_path || result.backdrop_path}
                                rating={result.vote_average < 2 || result.vote_average === null ? "5.2" : result.vote_average}
                              />
                            </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
