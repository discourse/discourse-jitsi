/* global themePrefix */

import EmberObject from "@ember/object";
import { withPluginApi } from "discourse/lib/plugin-api";
import JitsiEventComponent from "../components/modal/jitsi-event";

function initializeEventBuilder(api) {
  const currentUser = api.getCurrentUser();
  const store = api.container.lookup("service:store");
  const modal = api.container.lookup("service:modal");

  // Lazy import in case the plugin is not installed
  let discoursePostEvent;
  try {
    discoursePostEvent = require("discourse/plugins/discourse-calendar/discourse/widgets/discourse-post-event");
  } catch (e) {
    return;
  }

  api.addComposerToolbarPopupMenuOption({
    action: (toolbarEvent) => {
      const eventModel = store.createRecord("discourse-post-event-event");
      eventModel.setProperties({
        status: "public",
        custom_fields: EmberObject.create({}),
        starts_at: moment(),
        timezone: moment.tz.guess(),
      });

      modal.show(JitsiEventComponent, {
        model: {
          event: eventModel,
          toolbarEvent,
          updateCustomField: (field, value) =>
            discoursePostEvent.updateCustomField(eventModel, field, value),
          updateEventStatus: (status) =>
            discoursePostEvent.updateEventStatus(eventModel, status),
          updateEventRawInvitees: (rawInvitees) =>
            discoursePostEvent.updateEventRawInvitees(eventModel, rawInvitees),
          removeReminder: (reminder) =>
            discoursePostEvent.removeReminder(eventModel, reminder),
          addReminder: () => discoursePostEvent.addReminder(eventModel),
          onChangeDates: (changes) =>
            discoursePostEvent.onChangeDates(eventModel, changes),
          updateTimezone: (newTz, startsAt, endsAt) =>
            discoursePostEvent.updateTimezone(
              eventModel,
              newTz,
              startsAt,
              endsAt
            ),
        },
      });
    },
    group: "insertions",
    icon: "calendar-day",
    label: themePrefix("create_event"),
    condition: (composer) => {
      if (!currentUser || !currentUser.can_create_discourse_post_event) {
        return false;
      }

      const composerModel = composer.model;
      return (
        composerModel &&
        !composerModel.replyingToTopic &&
        (composerModel.topicFirstPost ||
          composerModel.creatingPrivateMessage ||
          (composerModel.editingPost &&
            composerModel.post &&
            composerModel.post.post_number === 1))
      );
    },
  });
}

export default {
  name: "add-jitsi-event-builder",
  initialize(container) {
    const siteSettings = container.lookup("service:site-settings");
    if (siteSettings.discourse_post_event_enabled) {
      withPluginApi("0.8.7", initializeEventBuilder);
    }
  },
};
