import Component from "@glimmer/component";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import didInsert from "@ember/render-modifiers/modifiers/did-insert";
import { service } from "@ember/service";
import DButton from "discourse/components/d-button";
import loadScript from "discourse/lib/load-script";
import { i18n } from "discourse-i18n";

export default class LaunchButton extends Component {
  @service site;
  @service currentUser;

  get label() {
    return this.args.label || i18n(themePrefix("launch_jitsi"));
  }

  get icon() {
    return settings.button_icon;
  }

  @action
  registerElement(element) {
    this.buttonElement = element;
  }

  @action
  launch() {
    if (this.args.isPreview) {
      return;
    }

    const domain = settings.meet_jitsi_domain;

    if (
      (this.site.mobileView && this.args.mobileIframe === "false") ||
      (!this.site.mobileView && this.args.desktopIframe === "false")
    ) {
      window.open(`https://${domain}/${this.args.room}`, "_blank");
      return;
    }

    loadScript(settings.jitsi_script_src).then(() => {
      const options = {
        roomName: this.args.room,
        height: 450,
        parentNode: this.buttonElement.parentNode,
        userInfo: {
          displayName: this.currentUser?.username || "",
        },
        interfaceConfigOverwrite: {
          DEFAULT_REMOTE_DISPLAY_NAME: "",
        },
      };

      const jitsiAPI = new window.JitsiMeetExternalAPI(domain, options);
      this.buttonElement.classList.add("hidden");

      jitsiAPI.addEventListener(
        "videoConferenceLeft",
        () => {
          this.buttonElement.classList.remove("hidden");
          this.buttonElement.nextElementSibling?.remove();
        },
        { once: true }
      );
    });
  }

  <template>
    <DButton
      class="btn btn-primary launch-jitsi"
      @icon={{this.icon}}
      @translatedLabel={{this.label}}
      {{didInsert this.registerElement}}
      {{on "click" this.launch}}
    />
  </template>
}
