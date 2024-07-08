import React from 'react';

const ShareButton = ({ url, title, text }) => {
  const handleShare = async () => {
    if(navigator.share){
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        });
        console.log('Content shared successfully');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      console.log('Web Share API not supported');
    }
  };

  return (
    <button
      onClick={handleShare}
      className='py-2 px-2 mx-2 md:mx-8 md:py-4 md:px-4 bg-orange-700 text-white font-semibold rounded-full hover:opacity-65 transition ease-in-out duration-700'
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="size-6">
             <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
        </svg>

    </button>
  );
};

export default ShareButton;
