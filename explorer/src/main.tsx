import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { installFetchProxy } from "./fetch-proxy";
import App from "./App";

installFetchProxy();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
