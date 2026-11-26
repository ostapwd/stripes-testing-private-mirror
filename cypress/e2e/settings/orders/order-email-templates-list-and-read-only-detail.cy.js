import Permissions from '../../../support/dictionary/permissions';
import Orders from '../../../support/fragments/orders/orders';
import OrderEmailTemplates from '../../../support/fragments/settings/orders/orderEmailTemplates';
import SettingOrdersNavigationMenu from '../../../support/fragments/settings/orders/settingOrdersNavigationMenu';
import TopMenu from '../../../support/fragments/topMenu';
import Users from '../../../support/fragments/users/users';
import getRandomPostfix from '../../../support/utils/stringTools';

describe('Orders', () => {
  describe('Settings (Orders)', () => {
    describe('Order email templates', () => {
      const randomPostfix = getRandomPostfix();
      const testData = {
        user: {},
        templates: {
          monoPurchase: OrderEmailTemplates.getDefaultTemplate({
            name: `AT_C1632068_Bestellung Mono Kauf_${randomPostfix}`,
            active: true,
            description: 'E-Mail-Bestellformular für Monographie-Bestellungen Kauf',
            subject: 'Bestellung SLUB Dresden',
            body: '<div>Sehr geehrte Damen und Herren,</div><div>{{order.poNumber}}</div>',
          }),
          monoStanding: OrderEmailTemplates.getDefaultTemplate({
            name: `AT_C1632068_Bestellung Mono Pflicht_${randomPostfix}`,
            active: true,
          }),
          serials: OrderEmailTemplates.getDefaultTemplate({
            name: `AT_C1632068_Bestellung Zeitschriften_${randomPostfix}`,
            active: false,
            description: 'Inactive template for serials',
          }),
        },
      };
      const { monoPurchase, monoStanding, serials } = testData.templates;

      before('Create test data', () => {
        cy.createTempUser([Permissions.uiSettingsOrdersCanViewAndEditAllSettings.gui]).then(
          (userProperties) => {
            testData.user = userProperties;

            // Precondition: User is in the "Settings" app
            cy.login(testData.user.username, testData.user.password, {
              path: TopMenu.settingsOrdersPath,
              waiter: Orders.waitSettingsPageLoading,
            });

            // Precondition: Templates are created by the test user (shown as the "Source" of the last update)
            Object.values(testData.templates).forEach((template) => {
              OrderEmailTemplates.createViaApi(template);
            });
          },
        );
      });

      after('Delete test data', () => {
        cy.getAdminToken();
        Object.values(testData.templates).forEach((template) => {
          OrderEmailTemplates.deleteViaApi(template.id);
        });
        Users.deleteViaApi(testData.user.userId);
      });

      it(
        'C1632068 "Order email templates" menu item opens the template list and read-only template detail with "Actions" menu (dresden)',
        { tags: ['extendedPath', 'dresden', 'C1632068'] },
        () => {
          // #1 Select the "Orders" section in the "Settings" app
          SettingOrdersNavigationMenu.verifyOrderEmailTemplatesMenuItemInGeneralGroup();

          // #2 Click the "Order email templates" menu item
          SettingOrdersNavigationMenu.selectOrderEmailTemplates();
          OrderEmailTemplates.waitLoading();
          OrderEmailTemplates.verifyTemplatesInList([
            monoPurchase.name,
            monoStanding.name,
            serials.name,
          ]);

          // #3 Click "Bestellung Mono Kauf" in the "Order email templates" list
          OrderEmailTemplates.selectTemplate(monoPurchase.name);
          OrderEmailTemplates.verifyTemplateDetailPaneReadOnly(monoPurchase.name);

          // #4 Expand the "Record last updated" accordion
          OrderEmailTemplates.expandRecordLastUpdatedAccordion(monoPurchase.name);
          OrderEmailTemplates.verifyRecordLastUpdated(monoPurchase.name, {
            lastName: testData.user.personal.lastName,
            firstName: testData.user.personal.firstName,
          });

          // #5 Check the "General information" accordion
          OrderEmailTemplates.verifyGeneralInformation(monoPurchase.name, {
            name: monoPurchase.name,
            active: true,
            description: monoPurchase.description,
          });

          // #6 Check the "Template content" accordion
          OrderEmailTemplates.verifyTemplateContent(monoPurchase.name, {
            subject: monoPurchase.header,
            bodyParts: ['Sehr geehrte Damen und Herren,', '{{order.poNumber}}'],
          });

          // #7 Click "Bestellung Zeitschriften" in the "Order email templates" list and check the "General information" accordion
          OrderEmailTemplates.selectTemplate(serials.name);
          OrderEmailTemplates.verifyGeneralInformation(serials.name, {
            name: serials.name,
            active: false,
            description: serials.description,
          });

          // #8 Click the "Actions" button in the detail pane header
          OrderEmailTemplates.openActionsMenu(serials.name);
          OrderEmailTemplates.verifyActionsMenuOptions();
        },
      );
    });
  });
});
