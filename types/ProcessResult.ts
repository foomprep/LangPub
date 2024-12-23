import { Language } from "../transcription";
import Chapter from "./Chapter";

export default interface ProcessResult {
  success: boolean;
  content?: string;
  chapters?: Chapter[];
  error?: string;
  metadata?: {
    title: string;
    creator: string;
    publisher: string;
    language: string | Language;
    description?: string;
  };
}
