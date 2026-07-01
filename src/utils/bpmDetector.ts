import * as realtimeBpm from 'realtime-bpm-analyzer';

/**
 * Detects the BPM of an audio file using realtime-bpm-analyzer
 * This specialized library offers better accuracy and reliability
 * Uses the "Local/Offline" strategy to analyze local files
 */
export async function detectBPM(audioFilePath: string, audioUrl?: string): Promise<number> {
  try {
    const { isDesktop } = await import('@/utils/platform');
    let audioData: ArrayBuffer;

    if (isDesktop()) {
      // Desktop: load the file using Tauri's fs
      const { readFile } = await import('@tauri-apps/plugin-fs');
      const fileData = await readFile(audioFilePath);
      audioData = fileData.buffer;
    } else {
      // Web: load the file from the provided blob URL
      if (!audioUrl) {
        throw new Error("No audio URL provided for web BPM detection");
      }
      const response = await fetch(audioUrl);
      audioData = await response.arrayBuffer();
    }

    // Create an audio context for analysis
    const audioContext = new AudioContext();

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(audioData);

    // Analyze the full buffer to detect BPM
    // This method returns the best BPM candidates
    const topCandidates = await realtimeBpm.analyzeFullBuffer(audioBuffer);

    // Close the audio context
    await audioContext.close();

    // Check that we have candidates
    if (!topCandidates || topCandidates.length === 0) {
      throw new Error("No BPM detected");
    }

    // Take the best candidate (first in the list)
    const bestCandidate = topCandidates[0];
    const bpm = Math.round(bestCandidate.tempo * 100) / 100;

    console.log(`BPM detected: ${bpm} (confidence: ${bestCandidate.count} occurrences)`);

    // Check that the BPM is in a reasonable range
    if (bpm < 30 || bpm > 300) {
      throw new Error("Detected BPM out of range");
    }

    return bpm;
  } catch (error) {
    console.error("Error detecting BPM:", error);
    throw error;
  }
}
