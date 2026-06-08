import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Required for WebGL in HtmlInCanvas onPaint
Config.setChromiumOpenGlRenderer('angle');
