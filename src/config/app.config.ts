type SttModel =
  | "onnx-community/whisper-tiny.en"
  | "onnx-community/whisper-base"
  | "onnx-community/whisper-small"
  | "onnx-community/whisper-large-v3-turbo";

type SttDtype = "q8" | "fp32" | "fp16" | "int8";

export interface AppConfig {
  sttModel: SttModel;
  dtype: SttDtype;
  cleanup: {
    model: string;
    apiKeyEnv: string;
    timeoutMs: number;
    minWordsForLLM: number;
  };
  holdToTalk: boolean;
}

export const appConfig: AppConfig = {
  sttModel: "onnx-community/whisper-tiny.en",
  dtype: "q8",
  cleanup: {
    model: "llama-3.1-8b-instant",
    apiKeyEnv: "GROQ_API_KEY",
    timeoutMs: 10_000,
    minWordsForLLM: 10,
  },
  holdToTalk: false,
};
