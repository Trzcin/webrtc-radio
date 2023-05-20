<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { io, Socket } from 'socket.io-client';
  import { getToken } from './utils/getToken';
  import { pushMetadata } from './utils/pushMetadata';
  import { generateMediaStream } from './utils/generateMediaStream';
  import Tailwind from './components/Tailwind.svelte';
  import Navbar from './components/Navbar.svelte';
  import StreamDetails from './components/StreamDetails.svelte';
  import CurrentMetadata from './components/CurrentMetadata.svelte';
  import type { Metadata } from './types/metadata';
  import Microphones from './components/Microphones.svelte';
  import { SpotifyCredentials } from './types/spotifyCredentials';

  let port: number = undefined;
  let firstPort = true;
  $: {
    if (port && socket && secret) {
      if (firstPort) {
        firstPort = false;
      } else {
        //@ts-ignore
        window.ipc.invoke('setSettingsVal', 'port', port);
        socket.emit('port', secret, port);
        //connect to server
        socket.close();
        socket = io(`http://localhost:${port}`);
        socket.emit('broadcaster', secret);
      }
    }
  }
  $: console.log(port);
  let secret: string;
  let stream: MediaStream;
  let socket: Socket;
  let peerConnections: { [key: string]: RTCPeerConnection } = {};
  const config: RTCConfiguration = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302'],
      },
    ],
  };

  let spotifyToken: string;

  let questions: string[] = [];
  let gainNodes: { [key: string]: GainNode } = {};
  let bassFilter: BiquadFilterNode;
  let midFilter: BiquadFilterNode;
  let trebleFilter: BiquadFilterNode;

  let metadata: Metadata;

  $: if (metadata && socket) {
    pushMetadata(metadata, socket);
  }

  $: watchers = Object.keys(peerConnections).length;

  onMount(async () => {
    const credentials: SpotifyCredentials = {
      id: process.env.SPOTIFY_ID!,
      secret: process.env.SPOTIFY_SECRET!,
    };

    //@ts-ignore
    port = await window.ipc.invoke('getSettingsVal', 'port');
    //@ts-ignore
    secret = await window.ipc.invoke('getSettingsVal', 'secret');

    //connect to server
    socket = io(`http://localhost:${port}`);
    socket.emit('broadcaster', secret);

    const [access_token, expires_in] = await getToken(credentials.id, credentials.secret);
    spotifyToken = access_token;
    setTimeout(async () => {
      spotifyToken = (await getToken(credentials.id, credentials.secret))[0];
    }, expires_in * 1000);
  });

  async function broadcast() {
    //webRTC stuff
    socket.on('watcher', (id: string) => {
      const peerConnection = new RTCPeerConnection(config);
      peerConnections[id] = peerConnection;
      //for svelte update state
      peerConnections = peerConnections;

      peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('candidate', { id, message: e.candidate });
        }
      };

      stream.getAudioTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.onnegotiationneeded = () => {
        negotiate(peerConnection, id);
      };
    });

    socket.on('answer', ({ id, message }) => {
      peerConnections[id].setRemoteDescription(message);
    });

    socket.on('candidate', ({ id, message }) => {
      peerConnections[id].addIceCandidate(new RTCIceCandidate(message));
    });

    socket.on('disconnectPeer', (id) => {
      peerConnections[id].close();
      delete peerConnections[id];

      //for svelte update state
      peerConnections = peerConnections;
    });

    socket.on('question', (question) => {
      questions = [...questions, question];
    });
  }

  function endBroadcast() {
    socket.close();
    stream.getTracks().forEach((track) => track.stop());
    Object.values(peerConnections).forEach((con) => con.close());
    peerConnections = {};
  }

  function negotiate(peerConnection: RTCPeerConnection, id) {
    peerConnection
      .createOffer()
      .then((sdp) => peerConnection.setLocalDescription(sdp))
      .then(() => {
        socket.emit('offer', { id, message: peerConnection.localDescription });
      });
  }

  onDestroy(() => {
    socket.close();
  });
</script>

<!-- svelte-ignore missing-declaration -->
<Tailwind />
<!-- svelte-ignore missing-declaration -->
<Navbar bind:port />

<main
  class="container2 space-y-14 lg:space-y-0 m-0 py-14 lg:py-0 lg:grid lg:grid-cols-2 lg:grid-rows-2 overflow-y-auto"
>
  <!-- svelte-ignore missing-declaration -->
  <StreamDetails startStream="{broadcast}" endStream="{endBroadcast}" bind:watchers />

  <div class="lg:row-span-2">
    <!-- svelte-ignore missing-declaration -->
    <CurrentMetadata bind:metadata bind:spotifyToken bind:questions />
  </div>

  <!-- svelte-ignore missing-declaration -->
  <Microphones bind:stream bind:peerConnections />
</main>
