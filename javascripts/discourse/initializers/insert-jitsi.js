/* global JitsiMeetExternalAPI */
import loadScript from "discourse/lib/load-script";
import { withPluginApi } from "discourse/lib/plugin-api";
import { iconHTML } from "discourse-common/lib/icon-library";
import I18n from "I18n";
import InsertJitsi from "../components/modal/insert-jitsi";

/* eslint-disable */
// prettier-ignore
function launchJitsi($elem, user, site) {
  const data = $elem.data();
  const domain = settings.meet_jitsi_domain;

  if (
    (site.mobileView && data.mobileIframe === false) ||
    (!site.mobileView && data.desktopIframe === false)
  ) {
    window.location.href = `https://${domain}/${data.room}`;
    return false;
  }

  loadScript(settings.jitsi_script_src).then(() => {
    const options = {
      roomName: data.room,
      height: 450,
      parentNode: $elem.parent()[0],
      interfaceConfigOverwrite: {
        DEFAULT_REMOTE_DISPLAY_NAME: "",
      },
    };

    const jitsiAPI = new JitsiMeetExternalAPI(domain, options);
    $elem.hide();

    if (user.username) {
      jitsiAPI.executeCommand("displayName", user.username);
    }

    jitsiAPI.addEventListener("videoConferenceLeft", () => {
      $elem.show();
      $elem.next().remove();
    });
  });
}

function attachButton($elem, user, site) {
  const buttonLabel =
    $elem.data("label") || I18n.t(themePrefix("launch_jitsi"));

  $elem.html(
    `<button class='launch-jitsi btn'>${iconHTML(
      settings.button_icon
    )} ${buttonLabel}</button>`
  );

  $elem.find("button").on("click", () => launchJitsi($elem, user, site));
}

function attachJitsi($elem, helper) {
  if (helper) {
    const { currentUser, site } = helper.widget;

    $elem.find("[data-wrap=discourse-jitsi]").each((idx, val) => {
      attachButton($(val), currentUser, site);
    });
  }
}
/* eslint-enable */

export default {
  name: "insert-jitsi",

  initialize() {
    withPluginApi("0.8.31", (api) => {
      const currentUser = api.getCurrentUser();
      const modal = api.container.lookup("service:modal");
      const settings = api.container.lookup("site-settings:main");

      if (settings.show_in_options_dropdown) {
        if (settings.only_available_to_staff && currentUser?.staff) {
          api.addComposerToolbarPopupMenuOption({
            icon: settings.button_icon,
            label: themePrefix("composer_title"),
            action: (toolbarEvent) => {
              modal.show(InsertJitsi, { model: { toolbarEvent } });
            },
          });
        }
      } else {
        if (
          settings.only_available_to_staff &&
          currentUser &&
          !currentUser.staff
        ) {
          return;
        }
        api.onToolbarCreate((toolbar) => {
          toolbar.addButton({
            title: themePrefix("composer_title"),
            id: "insertJitsi",
            group: "insertions",
            icon: settings.button_icon,
            perform: (toolbarEvent) =>
              modal.show(InsertJitsi, { model: { toolbarEvent } }),
          });
        });
      }

      api.decorateCooked(attachJitsi, { id: "discourse-jitsi" });
    });
  },
};
