// src/lib/exportUtils.ts

import { toast } from "sonner";

/**
 * Export data as a downloadable JSON file
 * @param data Object to export as JSON
 * @param fileName Name for the downloaded file
 */
export const exportToJson = (data: any, fileName: string) => {
  try {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(data, null, 2));

    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${fileName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    toast.success(`${fileName} downloaded successfully`);
  } catch (error) {
    console.error("Error exporting to JSON:", error);
    toast.error("Failed to download file");
  }
};

/**
 * Copy JSON data to clipboard
 * @param data Object to copy as JSON
 */
export const copyJsonToClipboard = (data: any) => {
  try {
    navigator.clipboard
      .writeText(JSON.stringify(data, null, 2))
      .then(() => {
        toast.success("Copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    toast.error("Failed to copy to clipboard");
  }
};
