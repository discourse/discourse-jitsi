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
    theme.save!
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
      page.find('[data-room="test-without-iframe"] button').click
      page.switch_to_window(page.windows.last)
      expect(page).to have_current_path("/test-without-iframe")
    end
  end
end
