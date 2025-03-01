import { withPluginApi } from "discourse/lib/plugin-api";
import LaunchButton from "../components/launch-button";
import InsertJitsiModal from "../components/modal/insert-jitsi";

function insertJitsi(api) {
  if (settings.only_available_to_staff && !api.getCurrentUser()?.staff) {
    return;
  }

  api.decorateCookedElement((element, helper) => {
    if (!helper?.renderGlimmer) {
      return;
    }

    const isPreview = !helper?.getModel();

    [...element.querySelectorAll("[data-wrap=discourse-jitsi]")].forEach(
      (wrapElement) => {
        const { label, room, mobileIframe, desktopIframe } =
          wrapElement.dataset;

        helper.renderGlimmer(wrapElement, <template>
          <LaunchButton
            @label={{label}}
            @room={{room}}
            @mobileIframe={{mobileIframe}}
            @desktopIframe={{desktopIframe}}
            @isPreview={{isPreview}}
          />
        </template>);
      }
    );
  });

  const modal = api.container.lookup("service:modal");

  if (settings.show_in_options_dropdown) {
    api.addComposerToolbarPopupMenuOption({
      icon: settings.button_icon,
      label: themePrefix("composer_title"),
      action: (toolbarEvent) => {
        modal.show(InsertJitsiModal, {
          model: { insertMeeting: toolbarEvent.addText },
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
          modal.show(InsertJitsiModal, {
            model: { insertMeeting: toolbarEvent.addText },
          }),
      });
    });
  }

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
        modal.show(InsertJitsiModal, {
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
}

export default {
  name: "insert-jitsi",

  initialize() {
    withPluginApi(insertJitsi);
  },
};
