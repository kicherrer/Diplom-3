const BUNNY_API_KEY = process.env.NEXT_PUBLIC_BUNNY_API_KEY;
const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

export const uploadToBunny = async (file: File) => {
  try {
    // 1. Get upload URL
    const response = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: file.name
      })
    });

    const { guid } = await response.json();

    // 2. Upload the file
    const uploadResponse = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${guid}`, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_API_KEY!,
        },
        body: file
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload video');
    }

    // 3. Get the video URL
    return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${guid}`;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
