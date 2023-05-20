<script lang="ts">
  import { onMount } from 'svelte';
  import { Socket, io } from 'socket.io-client';
  import { onDestroy } from 'svelte/internal';
  import type { Playlists } from './types/playlistsReq';
  import type { Tracks } from './types/tracksReq';
  import type { Metadata } from './types/metadata';
  import Tailwind from './components/Tailwind.svelte';
  import Controls from './components/Controls.svelte';
  import Question from './components/Question.svelte';

  let socket: Socket;

  let peerConnection: RTCPeerConnection;
  const config: RTCConfiguration = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302'],
      },
    ],
  };

  let isLive = false;
  let audio: HTMLAudioElement;
  let metadata: Metadata;
  let isSongSaved = false;

  const clientId = process.env.SPOTIFY_ID;
  const client_secret = process.env.SPOTIFY_SECRET;
  let spotifyToken: string;
  $: console.log(spotifyToken);

  onMount(() => {
    socket = io('http://localhost:3000');

    socket.on('offer', ({ id, message }) => {
      peerConnection = new RTCPeerConnection(config);
      peerConnection
        .setRemoteDescription(message)
        .then(() => peerConnection.createAnswer())
        .then((sdp) => peerConnection.setLocalDescription(sdp))
        .then(() => {
          socket.emit('answer', {
            id,
            message: peerConnection.localDescription,
          });
        });

      peerConnection.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        isLive = true;
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', { id, message: event.candidate });
        }
      };
    });

    socket.on('candidate', ({ _, message }) => {
      peerConnection
        .addIceCandidate(new RTCIceCandidate(message))
        .catch((e) => console.error(e));
    });

    socket.on('connect', () => {
      socket.emit('watcher');
    });

    socket.on('broadcaster', () => {
      socket.emit('watcher');
    });

    socket.on('metadata', (song) => {
      metadata = song;
      isSongSaved = false;
      checkIfSongIsSaved();
    });

    socket.on('end', () => {
      metadata = undefined;
      isLive = false;
    });

    refreshToken();
  });

  onDestroy(() => {
    socket.close();
  });

  async function saveSong() {
    if (spotifyToken && metadata.type === 'song') {
      const playlist_id = await getOrCreatePlaylist();
      if (isSongSaved) {
        await fetch(
          `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
          {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${spotifyToken}`,
            },
            body: JSON.stringify({
              tracks: [
                {
                  uri: metadata.uri,
                },
              ],
            }),
          }
        );

        isSongSaved = false;
      } else {
        await fetch(
          `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?uris=${encodeURIComponent(
            metadata.uri
          )}`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${spotifyToken}`,
            },
          }
        );
        isSongSaved = true;
      }
    } else {
      const urlParams = new URL(window.location.href).searchParams;
      if (
        urlParams.has('code') ||
        (localStorage.getItem('token') &&
          localStorage.getItem('token') != 'undefined')
      ) {
        refreshToken();
      } else {
        //get the code
        window.location.replace(
          `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
            'http://localhost:4000'
          )}&scope=playlist-modify-public%20playlist-modify-private%20playlist-read-private%20user-read-private%20user-read-email`
        );
      }
    }
  }

  async function refreshToken() {
    let type: 'authorization_code' | 'refresh_token' = 'refresh_token';

    const urlParams = new URL(window.location.href).searchParams;
    let code = localStorage.getItem('token');
    if (!code || code === 'undefined') {
      if (urlParams.has('code')) {
        code = urlParams.get('code');
        type = 'authorization_code';
      } else return;
    }

    const bodyJSON =
      type === 'authorization_code'
        ? {
            grant_type: type,
            code,
            redirect_uri: 'http://localhost:4000',
            client_id: clientId,
            client_secret,
          }
        : {
            grant_type: type,
            refresh_token: code,
            redirect_uri: 'http://localhost:4000',
            client_id: clientId,
            client_secret,
          };

    const formBody = Object.keys(bodyJSON)
      .map(
        (key) =>
          encodeURIComponent(key) + '=' + encodeURIComponent(bodyJSON[key])
      )
      .join('&');

    try {
      const response = await fetch(`https://accounts.spotify.com/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: formBody,
      });

      const data = await response.json();

      if (response.status != 200) {
        console.log(data.error_description);
      }

      spotifyToken = data.access_token;
      if (data.refresh_token != undefined) {
        localStorage.setItem('token', data.refresh_token);
      }

      setTimeout(refreshToken, data.expires_in * 1000);
    } catch (error) {
      console.log(error);
    }

    checkIfSongIsSaved();
  }

  async function getOrCreatePlaylist() {
    const response = await fetch(
      'https://api.spotify.com/v1/me/playlists?limit=5',
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${spotifyToken}`,
        },
      }
    );
    const data: Playlists = await response.json();
    const filtered = data.items.filter((item) => item.name === 'TopoRadio');

    if (filtered.length > 0) {
      return filtered[0].id;
    } else {
      //get user id
      const userRes = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${spotifyToken}`,
        },
      });
      const userData = await userRes.json();

      const user_id = userData.id;

      //create playlist
      const playlistRes = await fetch(
        `https://api.spotify.com/v1/users/${user_id}/playlists`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${spotifyToken}`,
          },
          body: JSON.stringify({
            name: 'TopoRadio',
            description: 'Zapisane piosenki z TopoRadia',
            public: false,
          }),
        }
      );
      const playlistData = await playlistRes.json();

      return playlistData.id;
    }
  }

  async function checkIfSongIsSaved() {
    if (!metadata || metadata.type !== 'song') return;

    const playlist_id = await getOrCreatePlaylist();
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?market=ES`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${spotifyToken}`,
        },
      }
    );
    const data: Tracks = await response.json();
    const filtered = data.items.filter(
      //@ts-ignore
      (item) => item.track.uri === metadata.uri
    );

    if (filtered.length > 0) {
      isSongSaved = true;
    }
  }

  function sendQuestion(question: string) {
    socket.emit('question', question);
  }

  function toggleStream() {
    if (!isLive) return;

    if (audio.paused) {
      audio.play();
      audio = audio;
    } else {
      audio.pause();
      audio = audio;
    }
  }
</script>

<Tailwind />
<main class="flex flex-col items-center pt-32 select-none">
  <h1 class="text-3xl font-semibold">WebRTC Radio</h1>

  {#if metadata}
    {#if metadata.type === 'song'}
      <img src={metadata.imgXl} alt="song" class="mt-10" />
      <p class="mt-5 text-lg font-semibold">{metadata.title}</p>
      <p class="mt-2">{metadata.artist}</p>
    {:else if metadata.type === 'question'}
      <img src="./img/music.jpg" alt="logo" class="w-72 h-auto mt-10" />
      <h2 class="mt-8 text-lg">Question from listener</h2>
      <h3 class="mt-2 font-semibold text-xl">{metadata.text}</h3>
    {:else}
      {#if metadata.img}
        <img
          src={metadata.img}
          alt="custom"
          id="metadata-img"
          class="mt-10 w-72 h-auto"
        />
      {:else}
        <img src="./img/music.jpg" alt="logo" class="w-72 h-auto mt-10" />
      {/if}

      <p class="text-lg font-semibold mt-5">{metadata.text}</p>
    {/if}
  {:else}
    <img src="./img/music.jpg" alt="logo" class="w-72 h-auto mt-10" />
  {/if}

  <!-- svelte-ignore a11y-media-has-caption -->
  <audio bind:this={audio} controls class="hidden" />

  <div class="flex items-center mt-8">
    <svg width="30" height="30">
      <circle cx="10" cy="15" r="10" fill={isLive ? '#EF4444' : '#656A71'} />
    </svg>

    <p class="font-medium">{isLive ? 'ONLINE' : 'OFFLINE'}</p>
  </div>

  <Controls
    bind:isLive
    {toggleStream}
    bind:audio
    bind:spotifyToken
    bind:metadata
    bind:isSongSaved
    {saveSong}
  />

  {#if !isLive}
    <p class="mt-5 text-gray-300 select-text">
        There is currently no transmission.
    </p>
  {/if}

  {#if isLive}
    <Question {sendQuestion} />
  {/if}
</main>
