export function getRandomID() {
  return Math.random().toString(36).slice(-8);
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unable to copy text", err);

    // Final fallback using a prompt
    // eslint-disable-next-line no-alert
    prompt("Copy to clipboard: Ctrl+C, Enter", text);
  } finally {
    document.body.removeChild(textArea);
  }
}

export function copyText(text) {
  // Fallback for outdated browsers
  if (!navigator.clipboard) {
    fallbackCopyText(text);
    return;
  }

  navigator.clipboard.writeText(text).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to copy to clipboard", err);
    fallbackCopyText(text);
  });
}

export function purifyRoomID(roomID) {
  let purifiedRoomID = roomID.trim();

  // Strip non-alphanumeric characters for better URL safety and encoding
  purifiedRoomID = purifiedRoomID.replace(/[^a-zA-Z0-9 ]/g, "");

  // Collapse spaces into camel case for better URL encoding
  purifiedRoomID = purifiedRoomID
    .replace(/\w+/g, function (txt) {
      // uppercase first letter and add rest unchanged
      return txt.charAt(0).toUpperCase() + txt.substring(1);
    })
    // remove any spaces
    .replace(/\s/g, "");
  return purifiedRoomID;
}
