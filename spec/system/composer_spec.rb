# frozen_string_literal: true

RSpec.describe "Jitsi component - composer view", system: true do
  let!(:theme) { upload_theme_component }

  fab!(:user) { Fabricate(:user, refresh_auto_groups: true) }
  fab!(:category)
  fab!(:topic) { Fabricate(:topic, category: category) }
  fab!(:post) { Fabricate(:post, topic: topic) }

  let(:composer) { PageObjects::Components::Composer.new }
  let(:topic_page) { PageObjects::Pages::Topic.new }

  before do
    sign_in(user)
    theme.update_setting(:only_available_to_staff, false)
    theme.update_setting(:show_in_options_dropdown, false)
    theme.update_setting(:hide_iframe_buttons, false)
    theme.save!
  end

  describe "toolbar button in composer" do
    it "inserts a button" do
      topic_page.visit_topic_and_open_composer(topic)
      expect(page).to have_css("button.insertJitsi")
    end

    it "inserts a button in the popup" do
      theme.update_setting(:show_in_options_dropdown, true)
      theme.save!

      topic_page.visit_topic_and_open_composer(topic)

      page.find(".toolbar-popup-menu-options[data-identifier='toolbar-menu__options']").click
      expect(page).to have_css(".dropdown-menu__item .btn[title='Discourse Jitsi']")
    end

    it "inserts a button for staff only" do
      theme.update_setting(:only_available_to_staff, true)
      theme.save!

      topic_page.visit_topic_and_open_composer(topic)
      expect(page).to_not have_css("button.insertJitsi")
    end
  end

  describe "toolbar button insertion modal" do
    it "it opens the modal and contains the form" do
      topic_page.visit_topic_and_open_composer(topic)
      page.find("button.insertJitsi").click
      expect(page).to have_css(".d-modal.insert-jitsi")
      expect(page).to have_css("[data-name='jitsiRoom']")
      expect(page).to have_css("[data-name='buttonText']")
      expect(page).to have_css("[data-name='mobileIframe']")
      expect(page).to have_css("[data-name='desktopIframe']")
    end

    it "the form doesn't contain the iframe fields" do
      theme.update_setting(:hide_iframe_buttons, true)
      theme.save!

      topic_page.visit_topic_and_open_composer(topic)
      page.find("button.insertJitsi").click
      expect(page).to_not have_css("[data-name='mobileIframe']")
      expect(page).to_not have_css("[data-name='desktopIframe']")
    end
  end

  describe "content insertion" do
    it "with no filled values" do
      topic_page.visit_topic_and_open_composer(topic)
      page.find("button.insertJitsi").click
      page.find("button[type='submit']").click
      composer.has_content?(
        '[wrap=discourse-jitsi room="identifier" mobileIframe="true" desktopIframe="true"][/wrap]',
      )
    end

    it "with filled values" do
      topic_page.visit_topic_and_open_composer(topic)
      page.find("button.insertJitsi").click
      fill_in "jitsiRoom", with: "test-room"
      fill_in "buttonText", with: "Join the meeting"
      page.find("button[type='submit']").click
      composer.has_content?(
        '[wrap=discourse-jitsi room="test-room" label="Join the meeting" mobileIframe="true" desktopIframe="true"][/wrap]',
      )
    end

    it "without iframes options" do
      topic_page.visit_topic_and_open_composer(topic)
      page.find("button.insertJitsi").click
      page.find("input[name='mobileIframe']").click
      page.find("input[name='desktopIframe']").click
      page.find("button[type='submit']").click
      composer.has_content?(
        '[wrap=discourse-jitsi room="identifier" mobileIframe="false" desktopIframe="false"][/wrap]',
      )
    end
  end

  describe "button in preview" do
    it "appears" do
      topic_page.visit_topic_and_open_composer(topic)
      page.find("button.insertJitsi").click
      fill_in "buttonText", with: "Join the meeting"
      page.find("button[type='submit']").click
      expect(composer.preview).to have_css("button.launch-jitsi")
      expect(composer.preview.find(".d-button-label")).to have_content("Join the meeting")
    end
  end
end
