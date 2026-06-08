import React, {useEffect} from 'react';
import {Composition} from 'remotion';
import {SquidexTerminal, PhoneLoop} from './SquidexTerminal';

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Sora:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap';

export const RemotionRoot: React.FC = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, []);

  return (
    <>
      <style>{`@import url('${FONT_URL}');`}</style>
      <Composition
        id="SquidexTerminal"
        component={SquidexTerminal}
        durationInFrames={510}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{}}
      />
      <Composition
        id="PhoneLoop"
        component={PhoneLoop}
        durationInFrames={255}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{}}
      />
    </>
  );
};
