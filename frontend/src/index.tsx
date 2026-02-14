import { registerRoot, Composition } from 'remotion';
import { LambdaComposition } from './components/editor/player/remotion/sequence/lambda-composition';

registerRoot(() => {
  return (
    <>
      <Composition
        id="VloghubVideo"
        component={LambdaComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          mediaFiles: [],
          textElements: [],
          fps: 30,
        }}
      />
    </>
  );
});
