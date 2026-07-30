import vinext from "vinext";
import { defineConfig } from "vite";

const usePolling = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig({
  plugins: [vinext()],
  server: usePolling
    ? { watch: { useFsEvents: false, usePolling: true } }
    : undefined,
});
