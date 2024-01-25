/* global settings */

// import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import LocalDatesCreate from "discourse/plugins/discourse-local-dates/discourse/components/modal/local-dates-create";
import { getRandomID, purifyRoomID } from "../../lib/jitsi";
// Lazy import in case the plugin is not installed
let buildParams;
try {
  buildParams =
    require("discourse/plugins/discourse-calendar/discourse/lib/raw-event-helper").buildParams;
} catch (e) {}

export default class InsertDateTime extends LocalDatesCreate {
  @service dialog;
  @service siteSettings;
  @service store;
  @service composer;

  @tracked jitsiRoom = "";
  @tracked includeJitsi = false;
  @tracked willCreateEvent = false;

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

  get canCreateEvent() {
    const composerModel = this.composer.model;
    return (
      composerModel &&
      !composerModel.replyingToTopic &&
      (composerModel.topicFirstPost ||
        composerModel.creatingPrivateMessage ||
        (composerModel.editingPost &&
          composerModel.post &&
          composerModel.post.post_number === 1))
    );
  }

  get roomURL() {
    const domain = settings.meet_jitsi_domain;
    const roomURL = new URL(this.roomID, `https://${domain}`);
    return roomURL.toString();
  }

  get recurringOptions() {
    if (this.willCreateEvent) {
      return [
        { id: "every_day", name: "Every Day" },
        { id: "every_month", name: "Every Month" },
        { id: "every_weekday", name: "Every Weekday" },
        { id: "every_week", name: "Every Week" },
        { id: "every_two_weeks", name: "Every Two Weeks" },
        { id: "every_four_weeks", name: "Every Four Weeks" },
      ];
    } else {
      return super.recurringOptions;
    }
  }

  saveEvent() {
    const config = this.computedConfig;

    if (!config.from) {
      this.closeModal();
      return;
    }

    const startsAt = config.from.dateTime;
    const endsAt = config.to.range ? config.to.dateTime : null;
    const url = this.includeJitsi ? this.roomURL : null;

    // Ensure recurrence exists within current type
    let recurrence = null;
    let recurringOptions = this.recurringOptions;
    if (
      recurringOptions.find((option) => option.id === this.recurring) !==
      undefined
    ) {
      recurrence = this.recurring;
    }

    this.model.event.setProperties({
      starts_at: startsAt,
      ends_at: endsAt,
      url,
      recurrence,
      timezone: this.timezone,
    });

    const eventParams = buildParams(
      startsAt,
      endsAt,
      this.model.event,
      this.siteSettings
    );
    const markdownParams = [];
    Object.keys(eventParams).forEach((key) => {
      let value = eventParams[key];
      markdownParams.push(`${key}="${value}"`);
    });

    this.model.insertMeeting(`[event ${markdownParams.join(" ")}]\n[/event]`);

    this.closeModal();
  }

  @action
  createEvent() {
    if (this.willCreateEvent) {
      this.saveEvent();
    } else {
      this.save();
    }
  }
}
