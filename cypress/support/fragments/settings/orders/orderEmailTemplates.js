import uuid from 'uuid';

import {
  Accordion,
  Button,
  DropdownMenu,
  KeyValue,
  NavListItem,
  Pane,
  TextArea,
  TextField,
  including,
  matching,
} from '../../../../../interactors';
import { COMMON_BUTTON_LABELS } from '../../../constants';

// Order email templates are stored in mod-template-engine (the same "templates" endpoint as patron notices)
const API_PATH = 'templates';
const ORDER_EMAIL_TEMPLATE_CATEGORY = 'Order';

const ACCORDION_LABELS = {
  RECORD_LAST_UPDATED: 'Record last updated',
  GENERAL_INFORMATION: 'General information',
  TEMPLATE_CONTENT: 'Template content',
};
const ACTIONS_MENU_OPTIONS = ['Duplicate', COMMON_BUTTON_LABELS.EDIT, COMMON_BUTTON_LABELS.DELETE];

const listPane = Pane('Order email templates');
const actionsButton = Button(COMMON_BUTTON_LABELS.ACTIONS);

const getDetailPane = (templateName) => Pane(templateName);
const getAccordion = (templateName, label) => getDetailPane(templateName).find(Accordion(label));
const getRecordLastUpdatedAccordion = (templateName) => getDetailPane(templateName).find(Accordion(including(ACCORDION_LABELS.RECORD_LAST_UPDATED)));

export default {
  waitLoading() {
    cy.expect(listPane.exists());
  },

  getDefaultTemplate({
    name = `AT_OrderEmailTemplate_${uuid()}`,
    active = true,
    description,
    subject = 'Email subject',
    body = '<div>Email body</div>',
  } = {}) {
    return {
      id: uuid(),
      name,
      active,
      description,
      category: ORDER_EMAIL_TEMPLATE_CATEGORY,
      header: subject,
      body,
      localizedTemplates: { en: { header: subject, body } },
      outputFormats: ['text/html'],
      templateResolver: 'mustache',
    };
  },

  createViaApi(template) {
    return cy
      .okapiRequest({
        method: 'POST',
        path: API_PATH,
        body: template,
        isDefaultSearchParamsRequired: false,
      })
      .then(({ body }) => body);
  },

  deleteViaApi(templateId) {
    return cy.okapiRequest({
      method: 'DELETE',
      path: `${API_PATH}/${templateId}`,
      isDefaultSearchParamsRequired: false,
      failOnStatusCode: false,
    });
  },

  verifyTemplatesInList(templateNames) {
    templateNames.forEach((templateName) => {
      cy.expect(listPane.find(NavListItem(templateName)).exists());
    });
  },

  selectTemplate(templateName) {
    cy.do(listPane.find(NavListItem(templateName)).click());
    cy.expect(getDetailPane(templateName).exists());
  },

  // Detail pane is read-only: accordions and "Actions" button are shown, no input fields
  verifyTemplateDetailPaneReadOnly(templateName) {
    const detailPane = getDetailPane(templateName);

    cy.expect([
      detailPane.exists(),
      getRecordLastUpdatedAccordion(templateName).exists(),
      getAccordion(templateName, ACCORDION_LABELS.GENERAL_INFORMATION).exists(),
      getAccordion(templateName, ACCORDION_LABELS.TEMPLATE_CONTENT).exists(),
      detailPane.find(actionsButton).exists(),
      detailPane.find(TextField()).absent(),
      detailPane.find(TextArea()).absent(),
    ]);
  },

  expandRecordLastUpdatedAccordion(templateName) {
    cy.do(getRecordLastUpdatedAccordion(templateName).clickHeader());
    cy.expect(getRecordLastUpdatedAccordion(templateName).has({ open: true }));
  },

  // Date format: M/D/YYYY h:mm AM/PM
  verifyRecordLastUpdated(templateName, { lastName, firstName }) {
    cy.expect([
      getRecordLastUpdatedAccordion(templateName).has({
        label: matching(/Record last updated: \d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} (AM|PM)/),
      }),
      getRecordLastUpdatedAccordion(templateName).has({
        content: including(`Source: ${lastName}, ${firstName}`),
      }),
    ]);
  },

  verifyGeneralInformation(templateName, { name, active, description }) {
    const accordion = getAccordion(templateName, ACCORDION_LABELS.GENERAL_INFORMATION);

    cy.expect([
      accordion.find(KeyValue('Template name')).has({ value: name }),
      accordion.find(KeyValue('Active')).has({ value: active ? 'Yes' : 'No' }),
    ]);
    if (description) {
      cy.expect(accordion.find(KeyValue('Description')).has({ value: description }));
    }
  },

  verifyTemplateContent(templateName, { subject, bodyParts = [] }) {
    const accordion = getAccordion(templateName, ACCORDION_LABELS.TEMPLATE_CONTENT);

    cy.expect([
      accordion.find(KeyValue('Email subject')).has({ value: subject }),
      accordion.find(Button('Preview')).exists(),
    ]);
    bodyParts.forEach((bodyPart) => {
      cy.expect(accordion.has({ content: including(bodyPart) }));
    });
  },

  openActionsMenu(templateName) {
    cy.do(getDetailPane(templateName).find(actionsButton).click());
    cy.expect(DropdownMenu().exists());
  },

  // Menu contains exactly "Duplicate", "Edit" and "Delete"
  verifyActionsMenuOptions() {
    ACTIONS_MENU_OPTIONS.forEach((option) => {
      cy.expect(DropdownMenu().find(Button(option)).exists());
    });
    cy.do(
      DropdownMenu().perform((menu) => {
        expect(menu.querySelectorAll('button')).to.have.length(ACTIONS_MENU_OPTIONS.length);
      }),
    );
  },
};
