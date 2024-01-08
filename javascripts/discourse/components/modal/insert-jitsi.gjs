/*eslint no-undef:0 */

import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { Input } from "@ember/component";
import { action } from "@ember/object";
import DButton from "discourse/components/d-button";
import DModal from "discourse/components/d-modal";
import TextField from "discourse/components/text-field";
import i18n from "discourse-common/helpers/i18n";

export default class InsertJitsi extends Component {
  @tracked mobileIframe = true;
  @tracked desktopIframe = true;
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
    const text = `[wrap=discourse-jitsi room="${roomID}"${btnTxt} mobileIframe="${this.mobileIframe}" desktopIframe="${this.desktopIframe}"][/wrap]`;
    this.args.model.toolbarEvent.addText(text);

    this.args.closeModal();
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
            />
            <div class="desc">{{i18n
                (themePrefix "modal.room_field_description")
              }}</div>
          </div>

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
        </div>

      </:body>
      <:footer>
        <DButton
          class="btn-primary"
          @disabled={{this.insertDisabled}}
          @label={{themePrefix "modal.insert"}}
          @action={{this.insert}}
        />
      </:footer>
    </DModal>
  </template>
}
