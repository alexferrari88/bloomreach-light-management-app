import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  // This is a simplified version - implement proper theme detection if you have dark mode
  const theme = "light"; // Replace with proper theme detection when implementing dark mode

  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        className: "group",
      }}
      theme={theme}
      closeButton
      richColors
    />
  );
}

// Add a simple theme hook to avoid errors (replace with proper implementation when adding dark mode)
// This is just a placeholder until you implement dark mode
export const useToast = () => {
  return { theme: "light" };
};
