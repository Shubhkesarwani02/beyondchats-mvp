import { NextResponse } from "next/server";

interface YouTubeVideo {
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
}

interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// Generate smart search queries using Gemini
async function generateSearchQueries(topic: string): Promise<string[]> {
  try {
    const geminiPrompt = `Given the educational topic: "${topic}"

Generate 3 concise YouTube search queries that best help a student learn this concept. 
Focus on educational content, tutorials, and explanations.
Return ONLY the search queries, one per line, without numbering or additional text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }],
        }),
      }
    );

    if (!response.ok) {
      console.warn('Gemini API failed, using original topic');
      return [topic];
    }

    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (generatedText) {
      const queries = generatedText
        .split('\n')
        .map((q: string) => q.trim().replace(/^\d+\.\s*/, ''))
        .filter((q: string) => q.length > 0);
      
      return queries.length > 0 ? queries : [topic];
    }
  } catch (error) {
    console.error('Error generating search queries with Gemini:', error);
  }
  
  return [topic];
}

// Fetch videos from YouTube Data API v3
async function fetchYouTubeVideos(query: string, maxResults: number = 5): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }

  const searchQuery = `${query} tutorial explained education`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(
    searchQuery
  )}&type=video&videoCategoryId=27&key=${apiKey}`; // Category 27 = Education

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('YouTube API error:', errorData);
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data: YouTubeSearchResponse = await response.json();
  return data.items || [];
}

// Get video durations (requires additional API call)
async function getVideoDurations(videoIds: string[]): Promise<Record<string, string>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey || videoIds.length === 0) {
    return {};
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch video durations');
      return {};
    }

    const data = await response.json();
    const durations: Record<string, string> = {};
    
    interface VideoItem {
      id: string;
      contentDetails: {
        duration: string;
      };
    }
    
    data.items?.forEach((item: VideoItem) => {
      durations[item.id] = formatDuration(item.contentDetails.duration);
    });

    return durations;
  } catch (error) {
    console.error('Error fetching video durations:', error);
    return {};
  }
}

// Convert ISO 8601 duration to readable format (PT1H2M10S -> 1:02:10)
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return 'N/A';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export async function POST(req: Request) {
  try {
    const { topic, pdfTitle, useGemini = true } = await req.json();

    if (!topic && !pdfTitle) {
      return NextResponse.json(
        { 
          success: false,
          error: "Topic or PDF title is required",
          videos: []
        },
        { status: 400 }
      );
    }

    const searchTopic = topic || pdfTitle;

    // Validate YouTube API key
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "YouTube API is not configured. Please contact support.",
          videos: []
        },
        { status: 500 }
      );
    }

    // Generate smart queries with Gemini (optional)
    let searchQueries = [searchTopic];
    if (useGemini && process.env.GEMINI_API_KEY) {
      try {
        searchQueries = await generateSearchQueries(searchTopic);
      } catch (geminiError) {
        console.warn('Gemini query generation failed, using original topic:', geminiError);
        // Continue with original topic
      }
    }

    // Use the first generated query (or fallback to original topic)
    const primaryQuery = searchQueries[0];
    console.log('🔍 Searching YouTube for:', primaryQuery);

    // Fetch videos from YouTube
    const videos = await fetchYouTubeVideos(primaryQuery, 6);

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: true,
        videos: [],
        query: primaryQuery,
        generatedQueries: searchQueries,
        message: "No videos found for this topic. Try a different search term."
      });
    }

    // Get video durations
    const videoIds = videos.map(v => v.id.videoId);
    const durations = await getVideoDurations(videoIds);

    // Enhance video data with durations
    const enhancedVideos = videos.map(video => ({
      ...video,
      duration: durations[video.id.videoId] || 'N/A',
    }));

    console.log(`✅ Found ${enhancedVideos.length} videos for "${primaryQuery}"`);

    return NextResponse.json({
      success: true,
      videos: enhancedVideos,
      query: primaryQuery,
      generatedQueries: searchQueries,
      count: enhancedVideos.length
    });

  } catch (error) {
    console.error("❌ YouTube recommendation error:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isQuotaError = errorMessage.includes('quotaExceeded');
    const isNetworkError = errorMessage.includes('fetch');
    
    let userFriendlyMessage = "Failed to fetch video recommendations. Please try again.";
    
    if (isQuotaError) {
      userFriendlyMessage = "YouTube API quota exceeded. Please try again later.";
    } else if (isNetworkError) {
      userFriendlyMessage = "Network error. Please check your connection and try again.";
    }

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        videos: []
      },
      { status: 500 }
    );
  }
}
