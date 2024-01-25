/* global JitsiMeetExternalAPI, settings, themePrefix */
import EmberObject from "@ember/object";
import loadScript from "discourse/lib/load-script";
import { withPluginApi } from "discourse/lib/plugin-api";
import { iconHTML, iconNode } from "discourse-common/lib/icon-library";
import I18n from "I18n";
import InsertDateTime from "../components/modal/insert-date-time";
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

function createChatButton(chat, modal, id, position) {
  return {
    title: themePrefix("composer_title"),
    id,
    group: "insertions",
    position,
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
  };
}

/* eslint-enable */

function removeToolbarItem(toolbar, group, id) {
  const targetGroup = toolbar.groups.find((value) => value.group === group);
  if (targetGroup !== undefined) {
    const buttonIndex = targetGroup.buttons.findIndex(
      (button) => button.id === id
    );
    if (buttonIndex !== -1) {
      targetGroup.buttons.splice(buttonIndex, 1);
    }
  }
}

export default {
  name: "insert-jitsi",

  initialize() {
    withPluginApi("0.8.31", (api) => {
      const currentUser = api.getCurrentUser();
      const modal = api.container.lookup("service:modal");
      const store = api.container.lookup("service:store");

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
                  modal.show(InsertJitsi, {
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
            modal.show(InsertJitsi, {
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
              modal.show(InsertJitsi, {
                model: { insertMeeting: toolbarEvent.addText },
              }),
          });
        });
      }

      // Calendar event integration (Replace "Insert date/time")
      if (currentUser && currentUser.can_create_discourse_post_event) {
        if (settings.replace_date_time) {
          api.onToolbarCreate((toolbar) => {
            // Remove the existing toolbar item
            removeToolbarItem(toolbar, "extras", "local-dates");

            // Add our new toolbar item
            toolbar.addButton({
              title: "discourse_local_dates.title",
              id: "insertJitsiEvent",
              group: "insertions",
              icon: settings.event_button_icon,
              perform: (toolbarEvent) => {
                const eventModel = store.createRecord(
                  "discourse-post-event-event"
                );
                eventModel.setProperties({
                  status: "public",
                  custom_fields: EmberObject.create({}),
                  starts_at: moment(),
                  timezone: moment.tz.guess(),
                });

                modal.show(InsertDateTime, {
                  model: {
                    event: eventModel,
                    insertMeeting: toolbarEvent.addText,
                    insertDate: toolbarEvent.addText,
                  },
                });
              },
            });
          });
        }
      }
    });
  },
};
