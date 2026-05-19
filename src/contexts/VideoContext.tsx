import React, { createContext, useContext, useState, useEffect } from 'react';

// Common cinematic videos from Pexels
export const VIDEOS = {
  DEFAULT: 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4', // Forest nature
  SPACE: 'https://videos.pexels.com/video-files/1851190/1851190-hd_1920_1080_25fps.mp4', // Galaxy
  HISTORY: 'https://videos.pexels.com/video-files/3163534/3163534-hd_1920_1080_30fps.mp4', // Architecture / Earth
  MATH: 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4', // Fallback for now
  ART: 'https://videos.pexels.com/video-files/3163534/3163534-hd_1920_1080_30fps.mp4', // Fallback
};

interface VideoContextType {
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
}

const VideoContext = createContext<VideoContextType>({
  videoUrl: VIDEOS.DEFAULT,
  setVideoUrl: () => {},
  opacity: 60,
  setOpacity: () => {},
});

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videoUrl, setVideoUrl] = useState(VIDEOS.DEFAULT);
  const [opacity, setOpacity] = useState(60);

  return (
    <VideoContext.Provider value={{ videoUrl, setVideoUrl, opacity, setOpacity }}>
      {/* Global Video Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-black transition-opacity duration-1000">
          <video 
              key={videoUrl} // Force remount on src change
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity duration-1000"
              style={{ opacity: opacity / 100 }}
              src={videoUrl}
          />
      </div>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoBackground = (url?: string) => {
  const context = useContext(VideoContext);
  if (!context) throw new Error("useVideoBackground must be used within VideoProvider");

  useEffect(() => {
    if (url && url !== context.videoUrl) {
      context.setVideoUrl(url);
    }
  }, [url]);

  return context;
};
