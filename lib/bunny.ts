const BUNNY_API_KEY = process.env.NEXT_PUBLIC_BUNNY_API_KEY;
const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

export async function uploadToBunny(file: File) {
  try {
    console.log('Starting Bunny.net upload process...');

    // 1. Создаем видео в библиотеке
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
      {
        method: "POST",
        headers: {
          "AccessKey": BUNNY_API_KEY!,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: file.name
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to initialize video upload');
    }

    const { guid } = await response.json();
    console.log('Video initialized with GUID:', guid);

    // 2. Загружаем файл
    const uploadResponse = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${guid}`,
      {
        method: "PUT",
        headers: {
          "AccessKey": BUNNY_API_KEY!,
        },
        body: file
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload video content');
    }

    console.log('Video upload successful');

    // 3. Возвращаем URL для встраивания видео
    return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${guid}`;
  } catch (error) {
    console.error('Bunny.net upload error:', error);
    throw error;
  }
}
