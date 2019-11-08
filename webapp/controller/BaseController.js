sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"sap/m/Dialog"
], function (Controller, UIComponent, mobileLibrary, Dialog) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return Controller.extend("com.federalmogul.sc.Z_PP_SC.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter : function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		
		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n");
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress : function () {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},
		
		getId: function(sName) {
			return this.getView().byId(sName);
		},
		
		setBindingContext: function(oContext, sContextName){
			return this.getView().setBindingContext(oContext, sContextName);
		},
		
		getBindingContext: function(sContextName){
			return this.getView().getBindingContext(sContextName);
		},
		
		showBigDialog: function(sTitle, sMsg, isSuccess = true){
			
			const state = isSuccess ? "Success" : "Error";
			const iconSrc = isSuccess ? "sap-icon://message-success" : "sap-icon://decline";
			const iconColor = isSuccess ? "green" : "red";
			
			const oDialog = new Dialog({
					title: sTitle,
					type: "Message",
					state: state,
					content: [
						new sap.m.FlexBox({
							justifyContent: "Center",
							alignItems: "Center",
							heigth: "100%",
							width: "100%",
							direction: "Column",
							alignContent: "SpaceAround",
							items: [
								new sap.ui.core.Icon({
									src: iconSrc,
									size: "1000%",
									color: iconColor
								}),
								new sap.m.Text({
									text: sMsg
								})
							]
						})
					],
					beginButton : new sap.m.Button({
						text : "OK",
						press : function(){
							oDialog.close();
						}
					}),
					afterClose: function() {
						oDialog.destroy();
					}
			});
			
			oDialog.open();
			
		},
		
		showBusyDialog: function(sTitle, sText){
			return new sap.m.BusyDialog({
				title: sTitle,
				text: sText
			});
		},
		
		showMessageToast: function(){
			
		}
		
	});

});