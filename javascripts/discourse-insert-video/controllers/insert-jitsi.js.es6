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
      jitsiRoom: null
    });
  },

  actions: {
    insert() {
      let text = `[wrap=discourse-jitsi room="${this.jitsiRoom}"][/wrap]`;
      this.toolbarEvent.addText(text);
      this.send("closeModal");
    },
    cancel() {
      this.send("closeModal");
    }
  }
});
