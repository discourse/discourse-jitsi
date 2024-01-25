/*eslint no-undef:0 */
/* global JitsiMeetExternalAPI */
import loadScript from "discourse/lib/load-script";
import { withPluginApi } from "discourse/lib/plugin-api";
import { iconHTML, iconNode } from "discourse-common/lib/icon-library";
import I18n from "I18n";
import InsertJitsiComponent from "../components/modal/insert-jitsi";

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

function createChatButton(chat, modal, id, position) {
  return {
    title: themePrefix("composer_title"),
    id,
    group: "insertions",
    position,
    icon: settings.button_icon,
    label: themePrefix("composer_title"),
    action: () => {
      modal.show(InsertJitsiComponent, {
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
  };
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

      const locations = settings.locations.split("|").map((value) =>
        value
          // Remove extra spaces
          .trim()
          // Convert to lowercase
          .toLowerCase()
          // Replace spaces with a single dash
          .replace(/\s/g, "-")
      );

      // Header button
      if (locations.includes("header-icon")) {
        // Decorate the header icons section
        api.decorateWidget("header-icons:before", (helper) => {
          // Create the new header icon
          return helper.h("li.header-icon-meeting", [
            helper.h(
              "a.icon.btn-flat",
              {
                onclick: () => {
                  modal.show(InsertJitsiComponent, {
                    model: {
                      // This model cannot insert
                      insertMeeting: () => {},
                      createOnly: true,
                      plainText: true,
                    },
                  });
                },
                attributes: {
                  target: "_blank",
                  title: I18n.t(themePrefix("launch_jitsi")),
                },
              },
              // Use the video icon
              iconNode(settings.button_icon)
            ),
          ]);
        });
      }

      // Chat plugin integration
      if (api.registerChatComposerButton) {
        const chat = api.container.lookup("service:chat");

        if (locations.includes("chat-icon")) {
          api.registerChatComposerButton(
            createChatButton(chat, modal, "insertChatJitsiInline", "inline")
          );
        }

        if (locations.includes("chat-toolbar")) {
          api.registerChatComposerButton(
            createChatButton(chat, modal, "insertChatJitsi", "dropdown")
          );
        }
      }

      if (locations.includes("composer-gear-menu")) {
        api.addComposerToolbarPopupMenuOption({
          icon: settings.button_icon,
          label: themePrefix("composer_title"),
          action: (toolbarEvent) => {
            modal.show(InsertJitsiComponent, {
              model: { insertMeeting: toolbarEvent.addText },
            });
          },
        });
      }

      if (locations.includes("composer-toolbar")) {
        api.onToolbarCreate((toolbar) => {
          toolbar.addButton({
            title: themePrefix("composer_title"),
            id: "insertJitsi",
            group: "insertions",
            icon: settings.button_icon,
            perform: (toolbarEvent) =>
              modal.show(InsertJitsiComponent, {
                model: { insertMeeting: toolbarEvent.addText },
              }),
          });
        });
      }
    });
  },
};
