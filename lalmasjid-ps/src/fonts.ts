import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

const FACES: [string, string][] = [
  ['QudsB', 'quds_bold.ttf'],
  ['QudsXK', 'quds_extrablack.ttf'],
  ['QudsXB', 'quds_extrabold.ttf'],
];

/** Loads every face, then flips to true. Text is measured on a canvas, so nothing renders before this. */
export const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(
      FACES.map(([name, file]) => {
        const f = new FontFace(name, `url(${staticFile('fonts/' + file)})`);
        return f.load().then((l) => (document.fonts as unknown as {add: (f: FontFace) => void}).add(l));
      }),
    )
      .then(() => {
        setReady(true);
        continueRender(h);
      })
      .catch((e) => cancelRender(e));
  }, [h]);
  return ready;
};
