import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add Font Awesome from CDN
const fontAwesome = document.createElement("link");
fontAwesome.rel = "stylesheet";
fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
document.head.appendChild(fontAwesome);

// Add meta information
const title = document.createElement("title");
title.textContent = "@answerthembot - Twitter Bot Dashboard";
document.head.appendChild(title);

// Add description meta tag
const description = document.createElement("meta");
description.name = "description";
description.content = "Dashboard for @answerthembot - A Twitter bot that generates witty humor or roasts in response to user mentions";
document.head.appendChild(description);

// Add Open Graph tags
const ogTitle = document.createElement("meta");
ogTitle.property = "og:title";
ogTitle.content = "@answerthembot - Twitter Bot Dashboard";
document.head.appendChild(ogTitle);

const ogDescription = document.createElement("meta");
ogDescription.property = "og:description";
ogDescription.content = "Manage your witty Twitter bot that responds with humor and roasts";
document.head.appendChild(ogDescription);

createRoot(document.getElementById("root")!).render(<App />);
