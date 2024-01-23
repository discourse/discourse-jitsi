/*eslint no-undef:0 */
/* global JitsiMeetExternalAPI */
import loadScript from "discourse/lib/load-script";
import { withPluginApi } from "discourse/lib/plugin-api";
import { iconHTML, iconNode } from "discourse-common/lib/icon-library";
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
    window.open(`https://${domain}/${data.room}`, "_blank");
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

      api.decorateCooked(attachJitsi, { id: "discourse-jitsi" });

      // Ensure the current user has access to the feature
      if (
        settings.only_available_to_staff &&
        currentUser &&
        !currentUser.staff
      ) {
        return;
      }

      // Header button
      if (settings.header_button) {
        // Decorate the header icons section
        api.decorateWidget("header-icons:before", (helper) => {
          // Create the new header icon
          return helper.h("li.header-icon-meeting", [
            helper.h(
              "a.icon.btn-flat",
              {
                onclick: () => {
                  modal.show(InsertJitsi, {
                    model: {
                      // This model cannot insert
                      insertMeeting: (_) => {},
                      createOnly: true,
                      plainText: true,
                    },
                  });
                },
                attributes: {
                  target: "_blank",
                  title: themePrefix("start_title"),
                },
              },
              // Use the video icon
              iconNode(settings.button_icon)
            ),
          ]);
        });
      }

      // Chat plugin integration
      if (settings.chat_button && api.registerChatComposerButton) {
        const chat = api.container.lookup("service:chat");

        api.registerChatComposerButton({
          title: themePrefix("composer_title"),
          id: "insertChatJitsi",
          group: "insertions",
          position: settings.chat_button_position,
          icon: settings.button_icon,
          label: themePrefix("composer_title"),
          action: () => {
            modal.show(InsertJitsi, {
              model: {
                insertMeeting: (text) => {
                  // Get the active channel ensuring one is present
                  const activeChannel = chat.activeChannel;
                  if (activeChannel === null) {
                    return;
                  }

                  // Append the meeting link to the draft
                  activeChannel.draft.message += text;
                },
                plainText: true,
              },
            });
          },
        });
      }

      if (settings.show_in_options_dropdown) {
        api.addComposerToolbarPopupMenuOption({
          icon: settings.button_icon,
          label: themePrefix("composer_title"),
          action: (toolbarEvent) => {
            modal.show(InsertJitsi, {
              model: {
                insertMeeting: toolbarEvent.addText,
              },
            });
          },
        });
      } else {
        api.onToolbarCreate((toolbar) => {
          toolbar.addButton({
            title: themePrefix("composer_title"),
            id: "insertJitsi",
            group: "insertions",
            icon: settings.button_icon,
            perform: (toolbarEvent) =>
              modal.show(InsertJitsi, {
                model: {
                  insertMeeting: toolbarEvent.addText,
                },
              }),
          });
        });
      }
    });
  },
};
