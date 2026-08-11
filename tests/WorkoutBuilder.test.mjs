import assert from "assert";
import { JSDOM } from "jsdom";

// Minimal DOM setup for WorkoutBuilder.
const html = `<!DOCTYPE html><html><body><div id="root"></div></body></html>`;
const dom = new JSDOM(html, { url: "http://localhost" });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { onLine: true };

global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

global.HTMLElement = dom.window.HTMLElement;

global.customElements = dom.window.customElements;

global.Event = dom.window.Event;

global.MouseEvent = dom.window.MouseEvent;

// Use fake module imports for React and router if needed.
import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import WorkoutBuilder from "../src/pages/WorkoutBuilder.jsx";
import { WorkoutProvider } from "../src/context/WorkoutContext.jsx";

async function testStartSuccess() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  await root.render(
    <MemoryRouter>
      <WorkoutProvider>
        <WorkoutBuilder />
      </WorkoutProvider>
    </MemoryRouter>
  );

  assert.ok(container.textContent.includes("Workout Builder"), "WorkoutBuilder should render");
}

async function run() {
  await testStartSuccess();
  console.log("WorkoutBuilder test rendered successfully");
}

await run();
