export type Metadata =
  | {
      type: 'song';
      title: string;
      artist: string;
      imgSm: string;
      imgXl: string;
      uri: string;
    }
  | { type: 'question'; text: string }
  | { type: 'custom'; img?: string; text: string };
