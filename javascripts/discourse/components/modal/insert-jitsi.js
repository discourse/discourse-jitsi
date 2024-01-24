/* global settings */

import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { copyText, getRandomID, purifyRoomID } from "../../lib/jitsi";

export default class InsertJitsiComponent extends Component {
  @tracked mobileIframe = settings.default_mobile_iframe;
  @tracked desktopIframe = settings.default_desktop_iframe;
  @tracked jitsiRoom = "";
  @tracked buttonText = "";
  @tracked copied = false;

  // Randomly generated meeting ID
  randomRoomID = getRandomID();

  get roomID() {
    let roomID = "";

    // User specified room ID
    if (this.jitsiRoom.length > 0) {
      roomID = purifyRoomID(this.jitsiRoom);
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
    copyText(this.roomURL);

    setTimeout(() => {
      this.copied = false;
    }, 1000);
  }

  @action
  cancel() {
    this.args.closeModal();
  }
}
