const jsdom = require("jsdom");
const { JSDOM } = jsdom;

JSDOM.fromURL("http://localhost:4321/stuff", {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  const window = dom.window;
  const document = window.document;
  
  // Wait for scripts to load and execute
  setTimeout(() => {
    console.log("Checking errors:");
    
    const card = document.querySelector('.stuff-card');
    if (card) {
      console.log("Found card:", card.getAttribute('data-modal'));
      try {
        card.click();
        console.log("Clicked card!");
      } catch (e) {
        console.error("Error clicking:", e);
      }
    } else {
      console.log("No card found.");
    }
  }, 2000);
}).catch(err => {
  console.error("JSDOM Error:", err);
});
