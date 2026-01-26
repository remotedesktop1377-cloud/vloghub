/**
 * Generate waveform data from audio file using Web Audio API
 */

export interface WaveformData {
  peaks: number[]; // Array of amplitude values (0-1)
  duration: number; // Audio duration in seconds
  sampleRate: number; // Sample rate used
}

/**
 * Generate waveform data from audio URL
 */
export async function generateWaveform(
  audioUrl: string,
  samples: number = 200 // Number of samples to generate
): Promise<WaveformData> {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audio = new Audio(audioUrl);
    audio.crossOrigin = 'anonymous';
    
    audio.addEventListener('loadedmetadata', () => {
      const source = audioContext.createMediaElementSource(audio);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Collect samples over time
      const peaks: number[] = [];
      let sampleCount = 0;
      const targetSamples = samples;
      const sampleInterval = audio.duration / targetSamples;
      let currentTime = 0;
      
      const collectSample = () => {
        if (currentTime >= audio.duration || sampleCount >= targetSamples) {
          audio.pause();
          audio.currentTime = 0;
          source.disconnect();
          analyser.disconnect();
          audioContext.close();
          
          resolve({
            peaks: peaks.length > 0 ? peaks : new Array(targetSamples).fill(0),
            duration: audio.duration,
            sampleRate: audioContext.sampleRate,
          });
          return;
        }
        
        audio.currentTime = currentTime;
        analyser.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) for this sample
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / bufferLength);
        peaks.push(rms);
        
        sampleCount++;
        currentTime += sampleInterval;
        
        // Use requestAnimationFrame for smoother collection
        requestAnimationFrame(collectSample);
      };
      
      audio.play().then(() => {
        collectSample();
      }).catch((error) => {
        // If play fails, try alternative method
        audio.load();
        audio.addEventListener('canplay', () => {
          collectSample();
        });
      });
    });
    
    audio.addEventListener('error', (error) => {
      reject(new Error(`Failed to load audio: ${error}`));
    });
    
    audio.load();
  });
}

/**
 * Alternative method: Generate waveform from audio buffer (more accurate but requires full load)
 */
export async function generateWaveformFromBuffer(
  audioUrl: string,
  samples: number = 200
): Promise<WaveformData> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const blockSize = Math.floor(channelData.length / samples);
    const peaks: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      const end = start + blockSize;
      
      // Calculate RMS for this block
      let sum = 0;
      for (let j = start; j < end && j < channelData.length; j++) {
        sum += channelData[j] * channelData[j];
      }
      const rms = Math.sqrt(sum / blockSize);
      peaks.push(rms);
    }
    
    audioContext.close();
    
    return {
      peaks,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
    };
  } catch (error) {
    audioContext.close();
    throw error;
  }
}

/**
 * Normalize waveform peaks to 0-1 range
 */
export function normalizeWaveform(peaks: number[]): number[] {
  const max = Math.max(...peaks);
  if (max === 0) return peaks;
  return peaks.map(peak => peak / max);
}

