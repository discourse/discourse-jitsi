/* global JitsiMeetExternalAPI */
import { withPluginApi } from "discourse/lib/plugin-api";
import showModal from "discourse/lib/show-modal";
import loadScript from "discourse/lib/load-script";
import { iconHTML } from "discourse-common/lib/icon-library";
import I18n from "I18n";

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

export default {
  name: "insert-jitsi",

  initialize() {
    withPluginApi("0.8.31", (api) => {
      let currentUser = api.getCurrentUser();

      if (settings.show_in_options_dropdown) {
        if (
          settings.only_available_to_staff &&
          currentUser &&
          !currentUser.staff
        ) {
          // do nothing if limited to staff
        } else {
          api.addComposerToolbarPopupMenuOption({
            icon: settings.button_icon,
            label: themePrefix("composer_title"),
            action: (toolbarEvent) => {
              showModal("insert-jitsi").setProperties({
                toolbarEvent,
              });
            },
          });
        }
      } else {
        api.onToolbarCreate((toolbar) => {
          if (
            settings.only_available_to_staff &&
            currentUser &&
            !currentUser.staff
          ) {
            return;
          }

          toolbar.addButton({
            title: themePrefix("composer_title"),
            id: "insertJitsi",
            group: "insertions",
            icon: settings.button_icon,
            perform: (e) =>
              showModal("insert-jitsi").setProperties({ toolbarEvent: e }),
          });
        });
      }

      api.decorateCooked(attachJitsi, { id: "discourse-jitsi" });
    });
  },
};
