export function generateMediaStream(
  microphones: MediaDeviceInfo[],
  stream: MediaStream,
  bassFilter: BiquadFilterNode,
  midFilter: BiquadFilterNode,
  trebleFilter: BiquadFilterNode,
  peerConnections: { [key: string]: RTCPeerConnection }
): [
  MediaStream,
  { [key: string]: GainNode },
  BiquadFilterNode,
  BiquadFilterNode,
  BiquadFilterNode
] {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  const audioContext = new AudioContext();
  const dest = audioContext.createMediaStreamDestination();
  const newGainNodes: { [key: string]: GainNode } = {};
  const temp = audioContext.createGain();
  temp.gain.value = 1;

  microphones.forEach(async (microphone) => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: microphone.deviceId },
    });
    const src = audioContext.createMediaStreamSource(mediaStream);

    //volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1;
    newGainNodes[microphone.deviceId] = gainNode;
    src.connect(gainNode);
    gainNode.connect(temp);
  });

  //bass
  let lastBass: number | undefined;
  if (bassFilter) lastBass = bassFilter.gain.value;

  const newBassFilter = audioContext.createBiquadFilter();
  newBassFilter.type = 'lowshelf';
  newBassFilter.frequency.value = 200;
  newBassFilter.gain.value = lastBass !== undefined ? lastBass : 1;
  temp.connect(newBassFilter);

  //mid
  let lastMid: number | undefined;
  if (midFilter) lastMid = midFilter.gain.value;

  const newMidFilter = audioContext.createBiquadFilter();
  newMidFilter.type = 'peaking';
  newMidFilter.frequency.value = 1000;
  newMidFilter.gain.value = lastMid !== undefined ? lastMid : 1;
  newBassFilter.connect(newMidFilter);

  //treble
  let lastTreble: number | undefined;
  if (trebleFilter) lastTreble = trebleFilter.gain.value;

  const newTrebleFilter = audioContext.createBiquadFilter();
  newTrebleFilter.type = 'highshelf';
  newTrebleFilter.frequency.value = 2000;
  newTrebleFilter.gain.value = lastTreble !== undefined ? lastTreble : 1;
  newMidFilter.connect(newTrebleFilter);

  newTrebleFilter.connect(dest);

  const newStream = dest.stream;

  const audioTrack = newStream.getAudioTracks()[0];
  Object.values(peerConnections).forEach((peer) => {
    const sender = peer
      .getSenders()
      .find((s) => s.track && s.track.kind === audioTrack.kind);
    sender?.replaceTrack(audioTrack);
  });

  return [
    newStream,
    newGainNodes,
    newBassFilter,
    newMidFilter,
    newTrebleFilter,
  ];
}
