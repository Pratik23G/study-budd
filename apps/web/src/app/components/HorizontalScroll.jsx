"use client";
import {useState, useEffect, useRef} from 'react';

const HorizontalScroll = ({ cards }) => {
    // building state variables
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef(null); // Fixed typo: carsouelRef → carouselRef

    const scrollCard = (index) => {
        if(carouselRef.current){ // Fixed typo here too
            const cardWidth = carouselRef.current.children[0].offsetWidth + 16;
            carouselRef.current.scrollTo({
                left: cardWidth * index,
                behavior: "smooth"
            });
            setCurrentIndex(index);
        }
    };

    const handleScroll = () => {
        if(carouselRef.current) { // Fixed typo here too
            const cardWidth = carouselRef.current.children[0].offsetWidth + 16;
            const scrollLeft = carouselRef.current.scrollLeft;
            const newIndex  = Math.round(scrollLeft / cardWidth);

            if(newIndex !== currentIndex) {
                setCurrentIndex(newIndex);
            }
        }
    };

    /* This function shall help the card to go back to the previous card without any troubles */
    const goBackPrevious = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1: cards.length - 1;
        scrollCard(newIndex);
    };

    const goForward = () => {
        const newIndex = currentIndex < cards.length - 1 ? currentIndex + 1: 0;
        scrollCard(newIndex);
    };

    return(
        <div className="relative max-w-6xl mx-auto">
            {/* carousel container */}
            <div ref={carouselRef} // Fixed typo: carsouelRef → carouselRef
                onScroll={handleScroll}
                className="flex gap-4 overflow-x-auto px-4 py-2 snap-x snap-mandatory scrollbar-hide"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                {cards.map((card, index) => (
                    <div key={index} className="flex-none w-80 bg-blue-400 text-white p-6 rounded-lg shadow-lg snap-center hover:shadow-2xl hover:shadow-blue-500/25 
                            transform hover:-translate-y-1 hover:scale-[1.02]
                            transition-all duration-300 ease-out
                            cursor-pointer">
                        <div className="text-center">
                            <p className = "text-lg leading-relaxed mb-4">
                                {card.description}
                            </p>
                            <div className="text-6xl mb-4">{card.icon}</div>
                            <h3 className="font-bold text-xl">{card.title}</h3>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Navigation Dots */}
            <div className="flex justify-center mt-6 space-x-2">
                {cards.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollCard(index)} 
                        className={`w-3 h-3 rounded-full border-2 border-blue-400 transition-all duration-300 ${
                            index === currentIndex 
                            ? 'bg-blue-400 scale-110' 
                            : 'bg-white hover:bg-blue-100'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Arrow Navigation */}
            <button 
                onClick={goBackPrevious}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
                aria-label="Previous slide"
            >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button 
                onClick={goForward}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
                aria-label="Next slide"
            >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

export default HorizontalScroll; // Fixed: Export should match filename