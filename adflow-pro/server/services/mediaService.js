/**
 * Media Service for AdFlow Pro
 * Handles URL validation and processing (Images, YouTube)
 */

const validateURL = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return url;
  } catch (e) {
    return null;
  }
};

const processMedia = (url) => {
  const validated = validateURL(url);
  if (!validated) {
    return {
      url: null,
      type: 'invalid',
      thumbnail: 'https://via.placeholder.com/400x300?text=No+Media',
      validation_status: 'failed'
    };
  }

  // Check for YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = validated.match(youtubeRegex);

  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      url: validated,
      type: 'video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      validation_status: 'success'
    };
  }

  // Treat as image by default (can be extended)
  return {
    url: validated,
    type: 'image',
    thumbnail: validated,
    validation_status: 'success'
  };
};

module.exports = {
  validateURL,
  processMedia
};
