// import { GoogleGenAI, Chat } from "@google/genai";


// let chatSession: Chat | null = null;

// export const initializeChat = (pdfText: string) => {
//   const ai = new GoogleGenAI({ apiKey: process.env.API_KEY});

//   // Initialize a new chat session with the PDF content as context in the system instruction
//   // Using gemini-3-pro-preview for complex reasoning and high adherence to instructions.
//   chatSession = ai.chats.create({
//     model: 'gemini-3-flash-preview',
//     config: {
//       temperature: 0, // Deterministic output to minimize hallucinations
//       topP: 0.95,
//       systemInstruction: `You are a Scientific Regulatory Assistant for a pharmaceutical company. 
//       Your mandate is to provide 100% accurate, evidence-based analysis of the provided documentation.

//       DOCUMENT CONTEXT:
//       <document_content>
//       ${pdfText}
//       </document_content>

//       STRICT OPERATIONAL PROTOCOLS:
//       1. **Zero Hallucination Policy**: Answer ONLY using facts explicitly found in the <document_content>. Do not use external knowledge, assumptions, or generalized medical information. 
//       2. **Negative Constraint**: If the specific information requested is not present in the document, you MUST state: "The provided document does not contain this information." Do not attempt to guess or infer.
//       3. **Citation Requirement**: You MUST cite the source for every key fact, claim, or data point. 
//          - **CRITICAL FORMAT**: Use **[Page X, Quote: "exact text snippet"]**.
//          - The "exact text snippet" must be a unique string of 5-10 words found directly on that page that identifies the specific location of the information.
//          - Example: "The drug was noninferior to the comparator [Page 12, Quote: "noninferior to the comparator at the primary"]."
//          - Place citations immediately after the relevant statement.
//          - Do not wrap citations in markdown bold (**). Keep them as plain text brackets.
//       4. **Response Style & Detail Level**:
//          - Provide answers that are concise yet comprehensive, similar to a Clinical Study Report summary.
//          - **Include specific data**: Always include relevant percentages, confidence intervals (95% CI), p-values, and sample sizes (n/N) when discussing results or demographics.
//          - **Structure**: Use clear sentences. If a question asks for a list or comparison, use bullet points for clarity.
//       5. **Professional Tone**: Maintain a clinical, objective, and regulatory-compliant tone. Avoid conversational fillers.
//       6. **Safety**: Do not provide medical advice. Summarize findings as reported in the document.

//       Example Interaction:
//       User: Did the drug meet the primary endpoint?
//       Bot: Yes. The drug was noninferior to the comparator at the primary endpoint (89.6% versus 87.7%; difference 1.9 [95% CI: –3.0, 6.8]) [Page 12, Quote: "primary efficacy endpoint was met"].

//       Adhere strictly to these rules.`,
//     },
//   });
// };

// export const sendMessageToGemini = async (message: string): Promise<string> => {
//   if (!chatSession) {
//     throw new Error("Chat session not initialized. Please upload a PDF first.");
//   }

//   try {
//     const response = await chatSession.sendMessage({ message });
//     return response.text || "I couldn't generate a response.";
//   } catch (error) {
//     console.error("Gemini API Error:", error);
//     throw new Error("Failed to get response from Gemini.");
//   }
// };



import { GoogleGenAI, LiveServerMessage, Modality, Blob, Chat } from '@google/genai';

/**
 * Helper to encode audio bytes for the Live API
 */
export function encodeAudio(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper to decode base64 audio strings
 */
export function decodeAudio(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Creates a PCM blob for sending audio input
 */
export function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encodeAudio(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const getScientificSystemPrompt = (pdfText: string) => `You are a Scientific Regulatory Assistant for a pharmaceutical company. 
Your mandate is to provide 100% accurate, evidence-based analysis of the provided documentation.

LANGUAGE POLICY:
- YOU MUST COMMUNICATE EXCLUSIVELY IN ENGLISH.
- INTERPRET ALL AUDIO INPUT AS ENGLISH. 
- PROVIDE ALL TRANSCRIPTIONS (INPUT AND OUTPUT) IN ENGLISH ONLY.
- DO NOT attempt to detect or switch to any other language. Even if the user's speech sounds like another language, you must transcribe it as the closest matching English words.
- If you cannot understand the user in English, ask for clarification in English.


DOCUMENT CONTEXT:
<document_content>
${pdfText}
</document_content>

STRICT OPERATIONAL PROTOCOLS:
1. **Zero Hallucination Policy**: Answer ONLY using facts explicitly found in the <document_content>. Do not use external knowledge, assumptions, or generalized medical information. 
2. **Negative Constraint**: If the specific information requested is not present in the document, you MUST state: "The provided document does not contain this information." Do not attempt to guess or infer.
3. **Citation Requirement**: You MUST cite the source for every key fact, claim, or data point. 
   - **CRITICAL FORMAT**: Use **[Page X, Quote: "exact text snippet"]**.
   - The "exact text snippet" must be a unique string of 5-10 words found directly on that page that identifies the specific location of the information.
   - Example: "The drug was noninferior to the comparator [Page 12, Quote: "noninferior to the comparator at the primary"]."
   - Place citations immediately after the relevant statement.
   - Do not wrap citations in markdown bold (**). Keep them as plain text brackets.
4. **Response Style & Detail Level**:
   - Provide answers that are concise yet comprehensive, similar to a Clinical Study Report summary.
   - **Include specific data**: Always include relevant percentages, confidence intervals (95% CI), p-values, and sample sizes (n/N) when discussing results or demographics.
   - **Structure**: Use clear sentences. If a question asks for a list or comparison, use bullet points for clarity.
5. **Professional Tone**: Maintain a clinical, objective, and regulatory-compliant tone. Avoid conversational fillers.
6. **Safety**: Do not provide medical advice. Summarize findings as reported in the document.

Example Interaction:
User: Did the drug meet the primary endpoint?
Bot: Yes. The drug was noninferior to the comparator at the primary endpoint (89.6% versus 87.7%; difference 1.9 [95% CI: –3.0, 6.8]) [Page 12, Quote: "primary efficacy endpoint was met"].

Adhere strictly to these rules.`;

let chatSession: Chat | null = null;

export const initializeChat = (pdfText: string) => {

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  if (!process.env.API_KEY) throw new Error("API Key is missing.");

  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      temperature: 0,
      topP: 0.95,
      systemInstruction: getScientificSystemPrompt(pdfText),
    },
  });
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    throw new Error("Chat session not initialized. Please upload a PDF first.");
  }

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get response from Gemini.");
  }
};

/**
 * Initializes the Gemini Live session.
 */
export const initGeminiLive = (
  pdfContent: string,
  callbacks: {
    onOpen: () => void;
    onMessage: (message: LiveServerMessage) => void;
    onError: (e: any) => void;
    onClose: (e: any) => void;
  }
) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  console.log("Initializing Gemini Live...");
  const ai = new GoogleGenAI({ apiKey });

  const MAX_LIVE_CONTEXT = 8000;
  const truncatedLiveContext = pdfContent.length > MAX_LIVE_CONTEXT
    ? pdfContent.substring(0, MAX_LIVE_CONTEXT) + "... [Truncated for stability]"
    : pdfContent;
    


  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: callbacks.onOpen,
      onmessage: callbacks.onMessage,
      onerror: callbacks.onError,
      onclose: callbacks.onClose,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      },
      systemInstruction: getScientificSystemPrompt(truncatedLiveContext),
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    }
  });
};
