/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import imdb from "../assets/imdb.png";
import hdIcon from "../assets/hdIcon.png";
import video from "../assets/video.png";
import comingsoon from "../assets/comingsoon.png";
import star from "../assets/star.png";
import LazyImage from "react-lazy-blur-image";
import "../card.css";

const Card = ({ src, last, rating, category, year }) => {
  const [recent, setRecent] = useState("");
  const [qualityIcon, setQualityIcon] = useState(null);

  useEffect(() => {
    determineQuality();
  }, [year]);

  const determineQuality = () => {
    const firstDate = new Date(year);
    const secondDate = new Date();

    const year1 = firstDate.getFullYear();
    const month1 = firstDate.getMonth();

    const year2 = secondDate.getFullYear();
    const month2 = secondDate.getMonth();

    const monthsApart = (year2 - year1) * 12 + (month2 - month1);

    if (year1 > year2) {
      setQualityIcon(
        <img src={comingsoon} alt="coming soon" className="w-8 h-8" />
      );
    } else if (monthsApart >= 2) {
      setQualityIcon(<img src={hdIcon} alt="hd" className="w-4 h-4" />);
    } else if (monthsApart === 1) {
      setRecent("Recently Added");
      setQualityIcon(<img src={video} alt="recorded" className="w-4 h-4" />);
    } else if (year1 > 2024) {
      setQualityIcon(<img src={video} alt="hd" className="w-4 h-4" />);
    } else {
      setRecent("Recently Added");
      setQualityIcon(<img src={video} alt="hd" className="w-4 h-4" />);
    }
  };

  return (
    <div>
      <div className="card-container relative">
        <LazyImage
          placeholder={`https://image.tmdb.org/t/p/w500${src}`}
          uri={`https://image.tmdb.org/t/p/w500${src}`}
          render={(src, style) => (
            <img
              src={src}
              alt="card background"
              style={style}
              loading="lazy"
              className="absolute top-0 left-0 h-full w-full object-cover z-0"
            />
          )}
        />
        <div className="absolute inset-0 bg-opacity-60 bg-gray-900 blur-md z-10"></div>
        <div className="overlay z-50">
          {rating && (
            <h1 className="overlay-rating flex flex-col items-center text-lg md:text-2xl">
              <img src={star} alt="star" className="star-img w-12 h-12" />
              {rating < 1 ? "5.2 / 10" : Math.ceil(rating * 10) / 10} / 10
            </h1>
          )}
          <div className="card-category">
            <h1 className="category-text text-orange-400 text-[1.3rem] font-bold">
              {category}
            </h1>
          </div>
        </div>
        <div className="content">
          <div className="flex items-center justify-between my-1 mx-4 w-full h-[2rem]">
            <div className="w-1/2 flex">
              <img src={imdb} alt="imdb" className="w-[2rem] h-[2rem] mr-1" />
              {rating && (
                <h1 className="flex items-center md:text-lg text-white font-bold z-50">
                  <span className="w-6 h-4">
                    <img src={star} alt="star" className="w-4 h-4 ml-1" />
                  </span>
                  {rating < 1 ? 5.2 : Math.ceil(rating * 10) / 10}
                </h1>
              )}
            </div>
            <div className="w-1/2 flex justify-end pr-6 md:pr-8">
              {year && qualityIcon}
            </div>
          </div>
          {year && recent && (
            <div className="absolute inset-x-0 bg-orange-600 w-[90%] md:w-[80%] bottom-5 h-5 rounded md:h-6 flex items-center justify-center uppercase text-center text-xs md:text-md mx-auto text-white font-bold z-40">
              {recent}
            </div>
          )}

          <div>
            <h1 className="absolute inset-x-0 bottom-2 uppercase text-center text-lg md:text-xl text-white font-bold">
              {category}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
