chrome.runtime.onMessage.addListener(request => {
  if (request === "OpenPopup") {
    chrome.windows.create({
      url: "/html/popup.html",
      type: "popup",
      focused: true,
      // ↓ bump these values to make the popup wider+taller
      width: 480,
      height: 600,
      top: 0,
      left: 1000,
    });
  }
});