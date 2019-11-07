sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("com.federalmogul.sc.Z_PP_SC.controller.App", {
		
		onInit: function () {
	
			

		},
		
		onAfterRendering: function() {
			
			const model = this.getView().getModel("Z_PP_PRODORDER_CONFIRM_SRV");
			
			console.log('on init ================',model);
			
		}
		
	});
	
});