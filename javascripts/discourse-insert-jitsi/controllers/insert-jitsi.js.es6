import Controller from "@ember/controller";
import ModalFunctionality from "discourse/mixins/modal-functionality";

export default Controller.extend(ModalFunctionality, {
  keyDown(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  },

  onShow() {
    this.setProperties({
      jitsiRoom: "",
      buttonText: "",
    });
  },

  randomID() {
    return Math.random().toString(36).slice(-8);
  },

  actions: {
    insert() {
      const btnTxt = this.buttonText ? ` label="${this.buttonText}"` : "";
      const roomID = this.jitsiRoom || this.randomID();
      let text = `[wrap=discourse-jitsi room="${roomID}"${btnTxt}][/wrap]`;
      this.toolbarEvent.addText(text);
      this.send("closeModal");
    },
    cancel() {
      this.send("closeModal");
    },
  },
});
