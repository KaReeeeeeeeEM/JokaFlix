import React from 'react';
import '../animation.css';

const IntroAnimation = () => {
  return (
    <div className="intro-animation-container text-center">
      <div className="logo text-white text-md md:text-2xl">
        <h1>Joka<span className="text-orange-600">Flix</span></h1>
        <div class="subheading text-orange-300">Home of Movies and Series</div>
      </div>
    </div>
  );
};

export default IntroAnimation;
