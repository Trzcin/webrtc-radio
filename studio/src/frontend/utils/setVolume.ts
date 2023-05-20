export function setVolume(
  event: Event & {
    currentTarget: EventTarget & HTMLInputElement;
  },
  id: string,
  gainNodes: { [key: string]: GainNode }
) {
  if (gainNodes[id]) {
    gainNodes[id].gain.value = parseFloat(
      (<HTMLInputElement>event.target).value
    );
  }
}
