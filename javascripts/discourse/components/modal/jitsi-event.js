/* global settings */

import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import Group from "discourse/models/group";
import { getRandomID, purifyRoomID } from "../../lib/jitsi";

// Lazy import in case the plugin is not installed
let buildParams;
try {
  buildParams =
    require("discourse/plugins/discourse-calendar/discourse/lib/raw-event-helper").buildParams;
} catch (e) {}

export default class JitsiEventComponent extends Component {
  @service dialog;
  @service siteSettings;
  @service store;

  @tracked flash = null;
  @tracked startsAt = moment(this.args.model.event.starts_at).tz(
    this.args.model.event.timezone || "UTC"
  );
  @tracked
  endsAt =
    this.args.model.event.ends_at &&
    moment(this.args.model.event.ends_at).tz(
      this.args.model.event.timezone || "UTC"
    );
  @tracked jitsiRoom = "";

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

  get roomURL() {
    const domain = settings.meet_jitsi_domain;
    const roomURL = new URL(this.roomID, `https://${domain}`);
    return roomURL.toString();
  }

  get availableRecurrences() {
    return [
      { id: "every_day", name: "Every Day" },
      { id: "every_month", name: "Every Month" },
      { id: "every_weekday", name: "Every Weekday" },
      { id: "every_week", name: "Every Week" },
      { id: "every_two_weeks", name: "Every Two Weeks" },
      { id: "every_four_weeks", name: "Every Four Weeks" },
    ];
  }

  @action
  groupFinder(term) {
    return Group.findAll({ term, ignore_automatic: true });
  }

  @action
  onChangeDates(dates) {
    this.args.model.onChangeDates(dates);
    this.startsAt = dates.from;
    this.endsAt = dates.to;
  }

  @action
  onChangeStatus(newStatus) {
    this.args.model.updateEventRawInvitees([]);
    this.args.model.updateEventStatus(newStatus);
  }

  @action
  setRawInvitees(_, newInvitees) {
    this.args.model.updateEventRawInvitees(newInvitees);
  }

  @action
  createEvent() {
    if (!this.startsAt) {
      this.args.closeModal();
      return;
    }

    // Set the event room URL
    this.args.model.event.url = this.roomURL;

    const eventParams = buildParams(
      this.startsAt,
      this.endsAt,
      this.args.model.event,
      this.siteSettings
    );
    const markdownParams = [];
    Object.keys(eventParams).forEach((key) => {
      let value = eventParams[key];
      markdownParams.push(`${key}="${value}"`);
    });

    this.args.model.toolbarEvent.addText(
      `[event ${markdownParams.join(" ")}]\n[/event]`
    );
    this.args.closeModal();
  }
}
