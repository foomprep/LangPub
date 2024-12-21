import BookMetadata from "./BookMetadata";
import ManifestItem from "./ManifestItem";
import SpineItem from "./SpineItem";

export default interface Book {
  metadata: BookMetadata;
  manifest: ManifestItem[];
  spine: SpineItem[];
  contents: {
    [key: string]: string;  // key is the ID, value is the content
  };
}
