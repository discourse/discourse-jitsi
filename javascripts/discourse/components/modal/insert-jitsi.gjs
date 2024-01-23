/*eslint no-undef:0 */

import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { Input } from "@ember/component";
import { action } from "@ember/object";
import DButton from "discourse/components/d-button";
import DModal from "discourse/components/d-modal";
import TextField from "discourse/components/text-field";
import i18n from "discourse-common/helpers/i18n";

function purifyRoomID(roomID) {
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

function getRandomID() {
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
    console.error("Unable to copy text", err);

    // Final fallback using a prompt
    prompt("Copy to clipboard: Ctrl+C, Enter", text);
  } finally {
    document.body.removeChild(textArea);
  }
}

function copyText(text) {
  // Fallback for outdated browsers
  if (!navigator.clipboard) {
    fallbackCopyText(text);
    return;
  }

  navigator.clipboard.writeText(text).catch((err) => {
    console.error("Failed to copy to clipboard", err);
    fallbackCopyText(text);
  });
}

export default class InsertJitsi extends Component {
  @tracked mobileIframe = settings.default_mobile_iframe;
  @tracked desktopIframe = settings.default_desktop_iframe;
  @tracked jitsiRoom = "";
  @tracked buttonText = "";
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
      const roomID = this.roomId;
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
    copyText(this.roomURL);
  }

  @action
  cancel() {
    this.args.closeModal();
  }

  <template>
    <DModal
      @title={{i18n (themePrefix "modal.title")}}
      class="insert-jitsi"
      @closeModal={{@closeModal}}
    >
      <:body>
        <div class="insert-jitsi-form">
          <div class="insert-jitsi-input">
            <label>
              {{i18n (themePrefix "room_label")}}
            </label>
            <TextField
              @value={{this.jitsiRoom}}
              @autofocus="autofocus"
              @autocomplete="off"
              minlength="6"
            />
            <div class="desc">{{i18n
                (themePrefix "modal.room_field_description")
              }}</div>
          </div>

          {{#unless @model.plainText}}

            <div class="insert-jitsi-input">
              <label>
                {{i18n (themePrefix "button_text_label")}}
              </label>
              <TextField
                @value={{this.buttonText}}
                @placeholderKey={{themePrefix "launch_jitsi"}}
              />
            </div>

            <div class="insert-jitsi-input">
              <label class="checkbox-label">
                <Input @type="checkbox" @checked={{this.mobileIframe}} />
                {{i18n (themePrefix "modal.mobile_iframe")}}
              </label>
            </div>

            <div class="insert-bbb-input">
              <label class="checkbox-label">
                <Input @type="checkbox" @checked={{this.desktopIframe}} />
                {{i18n (themePrefix "modal.desktop_iframe")}}
              </label>
            </div>

          {{/unless}}

          {{#if @model.createOnly}}
            <div class="insert-jitsi-input">
              <label>
                {{i18n (themePrefix "room_url_label")}}
              </label>
              <div class="inline-form full-width">
                <TextField @value={{this.roomURL}} @ontype readonly />
                <DButton
                  class="btn-primary btn-icon btn-copy"
                  @disabled={{this.insertDisabled}}
                  @title={{themePrefix "modal.copy"}}
                  @action={{this.copyRoomURL1}}
                  @icon={{settings.copy_button_icon}}
                />
              </div>
              <p class="desc desc--bottom">
                {{i18n (themePrefix "modal.url_description")}}
              </p>
            </div>
          {{/if}}
        </div>
      </:body>
      <:footer>
        {{#if @model.createOnly}}
          <DButton
            class="btn-primary"
            @disabled={{this.insertDisabled}}
            @label={{themePrefix "modal.launch"}}
            @action={{this.openRoomURL}}
          />
        {{else}}
          <DButton
            class="btn-primary"
            @disabled={{this.insertDisabled}}
            @label={{themePrefix "modal.insert"}}
            @action={{this.insert}}
          />
        {{/if}}
      </:footer>
    </DModal>
  </template>
}
