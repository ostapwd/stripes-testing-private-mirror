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
            name: `AT_C1632069_Bestellung Mono Kauf_${randomPostfix}`,
          }),
          monoStanding: OrderEmailTemplates.getDefaultTemplate({
            name: `AT_C1632069_Bestellung Mono Pflicht_${randomPostfix}`,
          }),
        },
      };
      const { monoPurchase, monoStanding } = testData.templates;

      before('Create test data', () => {
        cy.getAdminToken();
        Object.values(testData.templates).forEach((template) => {
          OrderEmailTemplates.createViaApi(template);
        });

        cy.createTempUser([Permissions.uiSettingsOrdersCanViewAndEditAllSettings.gui]).then(
          (userProperties) => {
            testData.user = userProperties;

            cy.login(testData.user.username, testData.user.password, {
              path: TopMenu.settingsOrdersPath,
              waiter: Orders.waitSettingsPageLoading,
            });

            // Precondition: User is on "Settings" > "Orders" > "Order email templates"
            SettingOrdersNavigationMenu.selectOrderEmailTemplates();
            OrderEmailTemplates.waitLoading();
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
        'C1632069 "Cancel" in "Delete Order email template" dialog keeps the template (dresden)',
        { tags: ['extendedPath', 'dresden', 'C1632069'] },
        () => {
          // #1 Click "Bestellung Mono Pflicht" in the "Order email templates" list
          OrderEmailTemplates.selectTemplate(monoStanding.name);
          OrderEmailTemplates.verifyTemplateDetailPaneReadOnly(monoStanding.name);

          // #2 Click the "Actions" button, then select "Delete"
          OrderEmailTemplates.openActionsMenu(monoStanding.name);
          OrderEmailTemplates.selectDeleteInActionsMenu();
          OrderEmailTemplates.verifyDeleteModal(monoStanding.name);

          // #3 Click the "Cancel" button
          OrderEmailTemplates.cancelDeleteModal();

          // #4 Check the "Order email templates" list
          OrderEmailTemplates.verifyTemplatesInList([monoPurchase.name, monoStanding.name]);

          // #5 Check the detail pane
          OrderEmailTemplates.verifyTemplateDetailPaneReadOnly(monoStanding.name);
          OrderEmailTemplates.verifyGeneralInformation(monoStanding.name, {
            name: monoStanding.name,
            active: true,
          });
        },
      );
    });
  });
});
