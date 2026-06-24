# frozen_string_literal: true

RSpec.describe "Jitsi component - post view", system: true do
  let!(:theme) { upload_theme_component }

  fab!(:user) { Fabricate(:user, refresh_auto_groups: true) }
  fab!(:category)
  fab!(:topic) { Fabricate(:topic, category: category) }
  fab!(:post) do
    Fabricate(
      :post,
      raw:
        'Message 1 [wrap=discourse-jitsi room="test-with-iframe" label="Join the meeting" mobileIframe="true" desktopIframe="true"][/wrap]
         Message 2 [wrap=discourse-jitsi room="test-without-iframe" label="Join the meeting" mobileIframe="false" desktopIframe="false"][/wrap]',
      topic: topic,
    )
  end

  let(:topic_page) { PageObjects::Pages::Topic.new }

  before do
    sign_in(user)
    theme.update_setting(:only_available_to_staff, false)

    # The real Jitsi API (meet.jit.si/external_api.js) isn't reachable from the
    # test environment, so stub it with a local script that mimics the bits the
    # component relies on: a JitsiMeetExternalAPI constructor that injects an
    # iframe into the meeting element and exposes addEventListener.
    stub_js = <<~JS
      window.JitsiMeetExternalAPI = function (domain, options) {
        options.parentNode.appendChild(document.createElement("iframe"));
        this.addEventListener = function () {};
      };
    JS
    theme.update_setting(
      :jitsi_script_src,
      "data:text/javascript;base64,#{Base64.strict_encode64(stub_js)}",
    )
    theme.save!

    # The stubbed script is a data: URI, which the theme's CSP doesn't allow.
    SiteSetting.content_security_policy = false
  end

  describe "in post" do
    it "shows a button" do
      topic_page.visit_topic(topic)
      expect(page).to have_css('[data-wrap="discourse-jitsi"] button.launch-jitsi', count: 2)
      expect(page).to have_css(
        '[data-wrap="discourse-jitsi"] button.launch-jitsi .d-button-label',
        text: "Join the meeting",
      )
    end

    it "shows an iframe on click" do
      topic_page.visit_topic(topic)
      page.find('[data-room="test-with-iframe"] button').click
      expect(page).to have_css('[data-room="test-with-iframe"] iframe')
    end

    it "redirects on click" do
      topic_page.visit_topic(topic)

      try_until_success { expect(page.windows.length).to eq(1) }

      page.find('[data-room="test-without-iframe"] button').click

      try_until_success { expect(page.windows.length).to eq(2) }
    end
  end
end
