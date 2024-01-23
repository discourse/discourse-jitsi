/*eslint no-undef:0 */

import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";

export default class InsertJitsiComponent extends Component {
  @tracked mobileIframe = settings.default_mobile_iframe;
  @tracked desktopIframe = settings.default_desktop_iframe;
  @tracked jitsiRoom = "";
  @tracked buttonText = "";
  @tracked copied = false;

  // Randomly generated meeting ID
  randomRoomID = this.getRandomID();

  get roomID() {
    let roomID = "";

    // User specified room ID
    if (this.jitsiRoom.length > 0) {
      roomID = this.purifyRoomID(this.jitsiRoom);
    }

    // If a custom room ID is empty or not specified use a random one
    if (roomID.length === 0) {
      roomID = this.randomRoomID;
    }

    return roomID;
  }

  get roomURL() {
    const domain = settings.meet_jitsi_domain;
    const roomURL = new URL(this.roomID, `https://${domain}`);
    return roomURL.toString();
  }

  purifyRoomID(roomID) {
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

  getRandomID() {
    return Math.random().toString(36).slice(-8);
  }

  fallbackCopyText(text) {
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

  copyText(text) {
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

  keyDown(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  @action
  insert() {
    let text;

    if (this.args.model.plainText) {
      text = this.roomURL;
    } else {
      const roomID = this.roomID;
      const btnTxt = this.buttonText ? ` label="${this.buttonText}"` : "";
      text = `[wrap=discourse-jitsi room="${roomID}"${btnTxt} mobileIframe="${this.mobileIframe}" desktopIframe="${this.desktopIframe}"][/wrap]`;
    }

    this.args.model.insertMeeting(text);
    this.args.closeModal();
  }

  @action
  openRoomURL() {
    this.args.closeModal();
    window.open(this.roomURL, "_blank");
  }

  @action
  copyRoomURL() {
    this.copied = true;
    this.copyText(this.roomURL);

    setTimeout(() => {
      this.copied = false;
    }, 1000);
  }

  @action
  cancel() {
    this.args.closeModal();
  }
}
