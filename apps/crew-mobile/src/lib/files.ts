import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

export type EncodedFile = { fileBase64: string; fileName: string; contentType: string };

/**
 * Mirrors the source app's fileToBase64() — same shape, RN-native source.
 * expo-file-system's SDK 54 API replaced readAsStringAsync/EncodingType with
 * the File class's .base64() method.
 */
export async function assetToEncodedFile(asset: ImagePicker.ImagePickerAsset): Promise<EncodedFile> {
  const fileBase64 = await new File(asset.uri).base64();
  const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? "photo.jpg";
  const contentType = asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg");
  return { fileBase64, fileName, contentType };
}

export async function pickFromCamera(): Promise<ImagePicker.ImagePickerAsset[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return [];
  const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  return result.canceled ? [] : result.assets;
}

export async function pickFromLibrary(): Promise<ImagePicker.ImagePickerAsset[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    allowsMultipleSelection: true,
    selectionLimit: 4,
    quality: 0.7,
  });
  return result.canceled ? [] : result.assets;
}
