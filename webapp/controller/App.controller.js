sap.ui.define([
	"./BaseController",
	"sap/m/MessageToast"
], function (BaseController, MessageToast) {
	"use strict";

	return BaseController.extend("com.federalmogul.sc.Z_PP_SC.controller.App", {
		
		onInit: function () {
		},
		
		onAfterRendering: function() {
			
			this.productionConfirm().getProdOrderConfirmationSet();
			
		},
		
		productionConfirm: function() {
			
			const that = this;
			const MODEL_NAME ="Z_PP_PRODORDER_CONFIRM_SRV";
			const model = this.getModel(MODEL_NAME);
			const bundle = this.getResourceBundle();        
			
			const order = that.getId("confirmProdOrder");
			const qty = that.getId("confirmQty");
			
			return {
				
				getProdOrderConfirmationSet: function () {
					
					const showWerkFail = () => {
						const ttl = bundle.getProperty("plantFailInit");
						const msg = bundle.getProperty("readPlantFailed");
						that.showBigDialog(ttl, msg, false);
					};
					
					const path = "/ProdOrderConfirmationSet(Werks='',Role='')";
					model.read(path, {
						success: function(oData) {
							
							const { Werks, Role } = oData;
							if(Werks && Role){
								
								const oContextPath = `/ProdOrderConfirmationSet(Werks='${Werks}',Role='${Role}')`;
								const oContext = new sap.ui.model.Context(model, oContextPath);
								that.setBindingContext(oContext, MODEL_NAME); //context binding must have the name of the model to work, path binding will be modelname>propName
								
							} else {
								showWerkFail();
							}
							
						},
						error: function() {
							showWerkFail();
						}
					});
					
				},
				
				getBarcodePrefixSet: function() {
					
					const orderNumVal = order.getValue();
					const qtyVal = qty.getValue();
					
					if (!orderNumVal) { order.setValueState("Error"); } else { order.setValueState("None"); }
					if (!qtyVal) { qty.setValueState("Error"); } else { qty.setValueState("None"); }
					
					if (!orderNumVal || !qtyVal) {
						MessageToast.show('Please enter required fields!');
						return;
					}
					
					const context = that.getBindingContext(MODEL_NAME); 
					const { Werks, HuExt, Aufnr, Menge } = context.getProperty();
					
					const barcode = `(251)${Aufnr}\(30)${Menge}`;
					const path = `/BarcodePrefixSet('${barcode}')`;
					
					model.read(path, {
						success: (odData) => {
							
							const { Matnr, Lgort, Vornr} = odData;
							const payload = {
								Werks,
								HuExt,
								Aufnr,
								Vornr,
								Matnr,
								Menge,
								Lgort,
								FlagFinalconf: undefined
							};
						
							this.productionConfirmation(payload);

						},
						error: () => {
							
							const ttl = bundle.getProperty("geMaterialError");
							const msg = bundle.getProperty("geMaterialErrorText");
							that.showBigDialog(ttl, msg, false);
							
						}
						
					});
					
				},
				
				productionConfirmation: function(payload){
					
					const path = "/ProdOrderConfirmationSet";
					
					const showError = (oDataMsg) => {
						const ttl = bundle.getProperty("SendFailureTitle");
						const msg = bundle.getProperty("SendFailureTitleText") + `\n${oDataMsg}` ;
						that.showBigDialog(ttl, msg, false);
					};
				
					const busyDialog = that.showBusyDialog(bundle.getProperty("BusyDialogTitle"), bundle.getProperty("BusyDialogText"))
					busyDialog.open();
					
					model.create(path, payload, {
						success: function(oData){
							
							const { Msg } = oData;
							
							if (!Msg) {

								const ttl = bundle.getProperty("confirmationSuccess");
								const msg = bundle.getProperty("confirmationSuccessText") + `\n${Msg}` ;
								that.showBigDialog(ttl, msg);

								//clear fields
								order.setValue("");
								qty.setValue("");
								
							} else {
								showError(Msg);
							}
							
							busyDialog.close();
							
						},
						error: function(error){
							busyDialog.close();
							showError(error.message);
						}
					});
					
				}
				
			};
			
		},
		
		/**** Events ***/
		
		onHandProdConfirmPress: function(){
			this.productionConfirm().getBarcodePrefixSet();
		}
		
	});
	
});