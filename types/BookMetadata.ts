export default interface BookMetadata {
  title: string;
  creator: string;
  language: string;
  publisher?: string;
  description?: string;
  subjects: string[];
  identifiers: {
    type: string;
    value: string;
  }[];
  date?: string;
}
