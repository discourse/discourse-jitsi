/*eslint no-undef:0 */

import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";

export default class InsertJitsiComponent extends Component {
  @tracked mobileIframe = settings.default_mobile_iframe;
  @tracked desktopIframe = settings.default_desktop_iframe;
  @tracked jitsiRoom = "";
  @tracked buttonText = "";

  keyDown(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  randomID() {
    return Math.random().toString(36).slice(-8);
  }

  @action
  insert() {
    const btnTxt = this.buttonText ? ` label="${this.buttonText}"` : "";
    const roomID = this.jitsiRoom || this.randomID();

    let text;

    if (this.args.model.plainText) {
      const domain = settings.meet_jitsi_domain;
      text = `https://${domain}/${roomID}`;
    } else {
      text = `[wrap=discourse-jitsi room="${roomID}"${btnTxt} mobileIframe="${this.mobileIframe}" desktopIframe="${this.desktopIframe}"][/wrap]`;
    }

    this.args.model.insertMeeting(text);
    this.args.closeModal();
  }

  @action
  cancel() {
    this.args.closeModal();
  }
}
