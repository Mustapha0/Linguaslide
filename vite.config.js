import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps asset paths relative so the built app also works inside the Android WebView.
export default defineConfig({
  plugins: [react()],
  base: "./"
});
