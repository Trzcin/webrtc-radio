import type { Song } from '../types/song';
import type { SearchRes } from '../types/spotifySearchRes';

export async function searchSpotify(spotifyQuerry: string, spotifyToken: string) {
  try {
    const request = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(spotifyQuerry)}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    const data: SearchRes = await request.json();

    const songs: Song[] = [];
    data.tracks.items.forEach((item) => {
      songs.push({
        title: item.name,
        artist: item.artists[0].name,
        imgSm: item.album.images[2].url,
        imgXl: item.album.images[1].url,
        uri: item.uri,
      });
    });

    return songs;
  } catch (error) {
    console.log(error);
    return [];
  }
}
