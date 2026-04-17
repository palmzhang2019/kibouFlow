import { afterEach } from "vitest";

afterEach(() => {
  if ("sessionStorage" in globalThis) {
    globalThis.sessionStorage.clear();
  }
});
