import Card from './Card'
import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

import '../slider.css';

// import required modules
import {  Autoplay, Navigation, Pagination } from 'swiper/modules';

const Showcase = () => {
  return (
    <div>
        <div className='flex flex-col md:flex-row items-center h-[5rem] md:h-[15rem] my-12 w-[90vw] md:w-[80vw] m-auto'>
                <Swiper
                slidesPerView={"auto"}
                spaceBetween={30}
                loop={true}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                  }}
                pagination={{
                clickable: true,
                }}
                modules={[Autoplay, Navigation]}
                className="mySwiper"
            >
                <SwiperSlide>Slide 1</SwiperSlide>
                <SwiperSlide>Slide 2</SwiperSlide>
                <SwiperSlide>Slide 3</SwiperSlide>
                <SwiperSlide>Slide 4</SwiperSlide>
                <SwiperSlide>Slide 5</SwiperSlide>
                <SwiperSlide>Slide 6</SwiperSlide>
                <SwiperSlide>Slide 7</SwiperSlide>
                <SwiperSlide>Slide 8</SwiperSlide>
                <SwiperSlide>Slide 9</SwiperSlide>
            </Swiper>
        </div>
    </div>
  )
}

export default Showcase