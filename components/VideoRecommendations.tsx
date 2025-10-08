"use client";

import { useState, useEffect, useCallback } from "react";

interface Video {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
      high?: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
  duration?: string;
}

interface VideoRecommendationsProps {
  pdfId: string;
  pdfTitle: string;
  autoFetch?: boolean;
}

export default function VideoRecommendations({ 
  pdfTitle, 
  autoFetch = false 
}: VideoRecommendationsProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customTopic, setCustomTopic] = useState("");

  const fetchVideos = useCallback(async (topic?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchTopic = topic || customTopic || pdfTitle;
      
      const response = await fetch("/api/recommend-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: searchTopic,
          pdfTitle: pdfTitle,
          useGemini: true 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVideos(data.videos || []);
        setSearchQuery(data.query);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch videos");
        setVideos([]);
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to load video recommendations");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [customTopic, pdfTitle]);

  useEffect(() => {
    if (autoFetch && pdfTitle) {
      fetchVideos(pdfTitle);
    }
  }, [pdfTitle, autoFetch, fetchVideos]);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim()) {
      fetchVideos(customTopic);
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
          📺 Video Recommendations
        </h2>
        
        {/* Custom Topic Search */}
        <form onSubmit={handleCustomSearch} className="mb-2 sm:mb-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Search for any topic..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={loading || !customTopic.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </form>

        {/* PDF Title Search Button */}
        <button
          onClick={() => fetchVideos(pdfTitle)}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="hidden sm:inline">Finding videos...</span>
              <span className="sm:hidden">Loading...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">Get Videos: &quot;{truncateText(pdfTitle, 25)}&quot;</span>
            </>
          )}
        </button>

        {searchQuery && !loading && (
          <p className="text-xs text-gray-500 mt-2 truncate">
            Results for: <span className="font-medium">{searchQuery}</span>
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600 flex-1">{error}</p>
          </div>
        </div>
      )}

      {/* Videos List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Finding best videos...</p>
            <p className="text-gray-400 text-xs mt-1">This may take a few seconds</p>
          </div>
        ) : videos.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {videos.map((video, index) => (
              <a
                key={`${video.id.videoId}-${index}`}
                href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-400 hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Thumbnail */}
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-full h-auto aspect-video object-cover"
                  />
                  {video.duration && video.duration !== 'N/A' && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-90 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                      {video.duration}
                    </div>
                  )}
                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-40">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 leading-snug">
                    {video.snippet.title}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    {video.snippet.channelTitle}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {video.snippet.description || 'No description available'}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-sm sm:text-base font-medium mb-2">No videos yet</p>
            <p className="text-gray-400 text-xs sm:text-sm max-w-xs">
              Click the button above to discover educational videos related to your PDF
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {videos.length > 0 && !loading && (
        <div className="border-t border-gray-200 p-2.5 sm:p-3 bg-gray-50">
          <p className="text-xs text-gray-500 text-center font-medium">
            ✨ Found {videos.length} educational video{videos.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
