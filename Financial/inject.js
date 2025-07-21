function init() {
  const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgElement.setAttribute("width", "50");
  svgElement.setAttribute("height", "50");
  svgElement.classList.add("centered-svg"); // Add class to SVG

  // Create a rectangle inside the SVG
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", "5");
  rect.setAttribute("y", "5");
  rect.setAttribute("width", "40");
  rect.setAttribute("height", "40");
  rect.setAttribute("rx", "10"); // Setting the horizontal radius for rounded corners
  rect.setAttribute("ry", "10"); // Setting the vertical radius for rounded corners
  rect.setAttribute("fill", "#4CAF50"); // Set the rectangle fill color

  // Append rectangle to the SVG
  svgElement.appendChild(rect);

  // Create text element for the rupee symbol
  const rupeeSymbol = document.createElementNS("http://www.w3.org/2000/svg", "text");
  rupeeSymbol.setAttribute("x", "50%");
  rupeeSymbol.setAttribute("y", "50%");
  rupeeSymbol.setAttribute("dy", ".35em");
  rupeeSymbol.setAttribute("text-anchor", "middle");
  rupeeSymbol.setAttribute("font-size", "24px");
  rupeeSymbol.setAttribute("fill", "white");
  rupeeSymbol.textContent = "₹";

  // Append rupee symbol to the SVG
  svgElement.appendChild(rupeeSymbol);

  // Style SVG for top right positioning
  svgElement.style.position = "fixed";
  svgElement.style.top = "30%";
  svgElement.style.left = "98%";
  svgElement.style.transform = "translate(-30%, -98%)";
  svgElement.style.zIndex = "9999"; // Set z-index to a high value
  svgElement.addEventListener("click", () => {
    if (chrome.runtime?.id) {
      chrome.runtime.sendMessage("OpenPopup")
    }
      
  });
  // Append SVG to the document body
  document.body.appendChild(svgElement);
}

init()