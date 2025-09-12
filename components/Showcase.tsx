import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { SHOWCASE_ITEMS } from '../constants';

const Showcase: React.FC = () => {
  const { language, t } = useLanguage();
  const showcaseItems = SHOWCASE_ITEMS[language];
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // This function is throttled by the browser's scroll event, so it's efficient.
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setCurrentIndex(index);
    }
  };
  
  const scrollTo = (index: number) => {
    setCurrentIndex(index);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.clientWidth * index,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      // Use a timeout to ensure handleScroll is called after snap scrolling finishes
      const scrollEndListener = () => {
        setTimeout(handleScroll, 150);
      };
      scrollContainer.addEventListener('scroll', scrollEndListener);
      return () => {
        scrollContainer.removeEventListener('scroll', scrollEndListener);
      };
    }
  }, []);

  return (
    <section className="py-20 bg-brand-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark">{t.showcaseTitle}</h2>
          <p className="text-lg text-brand-gray mt-4 max-w-2xl mx-auto">{t.showcaseSubtitle}</p>
        </div>
        
        <div className="max-w-sm mx-auto">
          {/* Mobile phone mockup */}
          <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
              <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
              <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
                  {/* Scrollable content */}
                  <div
                    ref={scrollContainerRef} 
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth h-full"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {showcaseItems.map((item, index) => (
                      <div key={index} className="flex-shrink-0 w-full h-full snap-center">
                        <img 
                          src={item.image} 
                          alt={t[item.title as keyof typeof t]} 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
              </div>
          </div>

          {/* Title and Dots */}
          <div className="text-center mt-8">
            <h3 className="text-xl font-semibold text-brand-dark mb-4 h-6 transition-opacity duration-300">
                {t[showcaseItems[currentIndex].title as keyof typeof t]}
            </h3>
            <div className="flex justify-center space-x-3">
              {showcaseItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    currentIndex === index ? 'bg-brand-blue scale-125' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Showcase;