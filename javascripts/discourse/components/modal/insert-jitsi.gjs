import Component from "@glimmer/component";
import { cached } from "@glimmer/tracking";
import { action } from "@ember/object";
import DModal from "discourse/components/d-modal";
import Form from "discourse/components/form";
import { isRailsTesting, isTesting } from "discourse/lib/environment";
import { i18n } from "discourse-i18n";

export default class InsertJitsiComponent extends Component {
  @cached
  get formData() {
    return {
      jitsiRoom: "",
      buttonText: "",
      mobileIframe: settings.default_mobile_iframe,
      desktopIframe: settings.default_desktop_iframe,
    };
  }

  keyDown(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  get randomID() {
    return isTesting() || isRailsTesting()
      ? "identifier"
      : Math.random().toString(36).slice(-10);
  }

  @action
  insert(data) {
    const roomID = data.jitsiRoom || this.randomID;
    let text;

    if (this.args.model.plainText) {
      const domain = settings.meet_jitsi_domain;
      text = `https://${domain}/${roomID}`;
    } else {
      const attributes = [
        `room="${roomID}"`,
        data.buttonText ? `label="${data.buttonText}"` : "",
        `mobileIframe="${data.mobileIframe}"`,
        `desktopIframe="${data.desktopIframe}"`,
      ]
        .filter(Boolean)
        .join(" ");

      text = `[wrap=discourse-jitsi ${attributes}][/wrap]`;
    }

    this.args.model.insertMeeting(text);
    this.args.closeModal();
  }

  <template>
    <DModal
      @title={{i18n (themePrefix "modal.title")}}
      class="insert-jitsi"
      @closeModal={{@closeModal}}
    >
      <:body>
        <Form
          @data={{this.formData}}
          @onSubmit={{this.insert}}
          class="insert-jitsi-form"
          as |form|
        >
          <form.Field
            @name="jitsiRoom"
            @title={{i18n (themePrefix "room_label")}}
            @description={{i18n (themePrefix "modal.room_field_description")}}
            as |field|
          >
            <field.Input />
          </form.Field>

          {{#unless @model.plainText}}
            <form.Field
              @name="buttonText"
              @title={{i18n (themePrefix "button_text_label")}}
              as |field|
            >
              <field.Input placeholder={{i18n (themePrefix "launch_jitsi")}} />
            </form.Field>

            {{#unless settings.hide_iframe_buttons}}
              <form.CheckboxGroup
                @title={{i18n (themePrefix "modal.iframe_title")}}
                as |group|
              >
                <group.Field
                  @name="mobileIframe"
                  @title={{i18n (themePrefix "modal.mobile_iframe")}}
                  as |field|
                >
                  <field.Checkbox />
                </group.Field>

                <group.Field
                  @name="desktopIframe"
                  @title={{i18n (themePrefix "modal.desktop_iframe")}}
                  as |field|
                >
                  <field.Checkbox />
                </group.Field>
              </form.CheckboxGroup>
            {{/unless}}
          {{/unless}}

          <form.Actions>
            <form.Submit @label={{themePrefix "modal.insert"}} />
          </form.Actions>
        </Form>
      </:body>
    </DModal>
  </template>
}
