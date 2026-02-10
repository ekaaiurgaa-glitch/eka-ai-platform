import React, { useState, useEffect } from 'react';

interface Video {
  id: number;
  title: string;
  url: string;
  type: 'feature' | 'ad';
}

const VIDEOS: Video[] = [
  { id: 1, title: 'PDI Flow Demo', url: '/videos/pdi-demo.mp4', type: 'feature' },
  { id: 2, title: 'Go4Garage Services', url: '/videos/g4g-ad-1.mp4', type: 'ad' },
  { id: 3, title: 'EKA-AI Diagnostics', url: '/videos/eka-diagnostics.mp4', type: 'feature' },
  { id: 4, title: 'Fleet Management', url: '/videos/g4g-ad-2.mp4', type: 'ad' },
  { id: 5, title: 'Job Card Workflow', url: '/videos/job-card-demo.mp4', type: 'feature' },
  { id: 6, title: 'Go4Garage Network', url: '/videos/g4g-ad-3.mp4', type: 'ad' },
  { id: 7, title: 'MG Model Explained', url: '/videos/mg-demo.mp4', type: 'feature' },
  { id: 8, title: 'Workshop Solutions', url: '/videos/g4g-ad-4.mp4', type: 'ad' },
  { id: 9, title: 'Invoice Generation', url: '/videos/invoice-demo.mp4', type: 'feature' },
  { id: 10, title: 'Go4Garage Family', url: '/videos/g4g-ad-5.mp4', type: 'ad' },
];

const VideoScroller: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full overflow-hidden bg-black">
      {VIDEOS.map((video, index) => (
        <div
          key={video.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col items-center justify-center h-full p-8 text-white">
            <div className="w-full max-w-md aspect-video bg-gray-800 rounded border border-brand-orange flex items-center justify-center mb-4">
              <p className="text-sm text-gray-400">Video: {video.title}</p>
            </div>
            <h3 className="text-xl font-bold text-brand-orange">{video.title}</h3>
            <p className="text-sm text-gray-400 mt-2">
              {video.type === 'feature' ? 'Product Feature' : 'Go4Garage Advertisement'}
            </p>
          </div>
        </div>
      ))}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {VIDEOS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-brand-orange w-8' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoScroller;
