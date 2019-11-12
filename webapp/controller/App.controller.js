sap.ui.define([
	"./BaseController",
	"sap/m/MessageToast"
], function (BaseController, MessageToast) {
	"use strict";

	return BaseController.extend("com.federalmogul.sc.Z_PP_SC.controller.App", {
		
		onInit: function () {
		},
		
		onAfterRendering: function() {
			
			//todo: probably all onAfter methods are the same when all apps is setup, refactor and consolidate similar codes
			this.prodOrderConfirm().onProdOrderConfirmationSet();
			this.prodOrderIssue().onIssueSet();
			
		},
		
		state: {
			prodOrderIssue: {
				isFirstScan: false
			}
		},
		
		prodOrderConfirm: function() {
			
			const that = this;
			const MODEL_NAME ="Z_PP_PRODORDER_CONFIRM_SRV";
			const model = this.getModel(MODEL_NAME);
			const bundle = this.getResourceBundle();        
			
			const order = that.getId("confirmProdOrder");
			const qty = that.getId("confirmQty");
			
			return {
				
				onProdOrderConfirmationSet: function () {
					
					const showWerkFail = () => {
						const ttl = bundle.getProperty("plantFailInit");
						const msg = bundle.getProperty("readPlantFailed");
						that.showBigDialog(ttl, msg, false);
					};
					
					const path = "/ProdOrderConfirmationSet(Werks='',Role='')";
					model.read(path, {
						success: function(oData) {
							
							console.log(path, oData)
							
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
				
				getBarcodePrefixSet: function(inputBarcode = "", oEvent) {
					
					const showValueState = (orderNumVal, qtyVal) => {
						
						if (!orderNumVal) { order.setValueState("Error"); } else { order.setValueState("None"); }
						if (!qtyVal) { qty.setValueState("Error"); } else { qty.setValueState("None"); }
						
						if (!orderNumVal || !qtyVal) {
							MessageToast.show("Please enter required fields!");
							return;
						}
						
					};
					
					const context = that.getBindingContext(MODEL_NAME); 
					let { Werks, HuExt, Aufnr, Menge } = context.getProperty();
					let orderNumVal = "";
					let qtyVal = "";
					let barcode = "";

					if (!inputBarcode) {
						
						barcode = `(251)${Aufnr}\(30)${Menge}`;
						orderNumVal = order.getValue();
						qtyVal = qty.getValue();
						
						showValueState(orderNumVal, qtyVal);
						
					} else {
						
						barcode = inputBarcode.toString();
						oEvent.getSource().setValue("");
						
					}
				
					const path = `/BarcodePrefixSet('${encodeURIComponent(barcode)}')`;
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
						
							if (inputBarcode) {
								
								order.setValue(odData.Aufnr);
								qty.setValue(odData.Menge);
								
								payload.Aufnr = odData.Aufnr;
								payload.Menge = odData.Menge.toString();
								
							}
						
							this.productionConfirmation(payload);

						},
						error: (error) => {
							
							const ttl = bundle.getProperty("geMaterialError");
							const msg = bundle.getProperty("geMaterialErrorText");
							that.showBigDialog(ttl, `${msg}\n${error.message}`, false);
							
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
				
					const busyDialog = that.showBusyDialog(
												bundle.getProperty("BusyDialogTitle"),
												bundle.getProperty("BusyDialogText")
											);
					busyDialog.open();
					
					model.create(path, payload, {
						success: function(oData){
							
							const { Msg } = oData;
							
							if (!Msg) {

								const ttl = bundle.getProperty("confirmationSuccess");
								const msg = bundle.getProperty("confirmationSuccessText") + `\n${Msg}` ;
								const dialog = that.showBigDialog(ttl, msg);
								setTimeout(() => dialog.close(), 3000); //close dialog after 3 sec

								//clear fields
								order.setValue("");
								qty.setValue("");
								
								setTimeout(() => MessageToast.show(bundle.getProperty("resetFieldText")), 3500); //close dialog after 3.5 sec
								
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
		
		prodOrderIssue: function() {
			
			const that = this;
			const MODEL_NAME ="Z_PP_ISSUE_TO_PRODUCTION_SRV";
			const model = this.getModel(MODEL_NAME);
			const bundle = this.getResourceBundle();
			const state = this.state.prodOrderIssue;
			
			return {
				
				onIssueSet: function(){
					
					const showWerkFail = () => {
						const ttl = bundle.getProperty("plantFailInit");
						const msg = bundle.getProperty("readPlantFailed");
						that.showBigDialog(ttl, msg, false);
					};
					
					const path = "/IssueSet(Werks='',Role='')";
					model.read(path, {
						success: function(oData) {
							
							console.log(path, oData)
							
							const { Werks, Role } = oData;
							if (Werks && Role){
								
								const oContextPath = `/IssueSet(Werks='${Werks}',Role='${Role}')`;
								const oContext = new sap.ui.model.Context(model, oContextPath);
								that.setBindingContext(oContext, MODEL_NAME);
								
							} else {
								showWerkFail();
							}
							
						},
						error: function() {
							showWerkFail();
						}
					});
					
				},
				
				handleBarcodeInput: function(barcode, oEvent){
					
					const context = that.getBindingContext(MODEL_NAME); 
					const path = `/BarcodePrefixSet('${encodeURIComponent(barcode)}')`;
					const oBarcode = oEvent.getSource();
					
					const showBarcodeFailure = () => {
						const ttl = bundle.getProperty("barcodeFailure");
						const msg = bundle.getProperty("barcodeFailureText") + barcode;
						that.showBigDialog(ttl, msg, false);
					};
					
					model.read(path, {
						success: function(oData){
						
							const {Aufnr, Lgort, Lgobe, HuExt, Matnr, Menge } = oData;
							const contextProps = context.getProperty();
							
							//show barcode error if no SLOC defined
							if (!Lgort && !Aufnr && !contextProps.Aufnr){
								showBarcodeFailure();
							}
							
							//assign these values only if its first scan
							if (!state.isFirstScan) {
								model.setProperty("Aufnr", Aufnr, context, false); //prod order
								model.setProperty("Lgort", Lgort, context, false); //SLOC
								model.setProperty("Lgobe", Lgobe, context, false); //SLOC name
							}
							
							model.setProperty("Matnr", Matnr, context, false); //material number
							model.setProperty("Menge", (!!Number(Menge) ? Number(Menge) : 0) , context, false); //qty
							model.setProperty("HuExt", HuExt, context, false); //handling unit
							
							//if not first scan show toast msg
							if (!state.isFirstScan) {
								MessageToast.show("Please scan now order to be issued.");
							} 
							
							state.isFirstScan = true; //set first scan
							oBarcode.setValue(""); //set barcode to clear
							
							//todo: batches
							//todo: work center select, prod order selection 
							
									
						},
						error: function(){
							showBarcodeFailure();
						}
						
					});
					
				},
				
				issueProductionOrder: function(){
					
					const busyDialog = that.showBusyDialog(
												bundle.getProperty("BusyDialogTitle"),
												bundle.getProperty("BusyDialogText")
											);
					busyDialog.open();
					
					const showError = (oDataMsg) => {
						const ttl = bundle.getProperty("issueError");
						const msg = bundle.getProperty("issueError") + `\n${oDataMsg}` ;
						that.showBigDialog(ttl, msg, false);
					};
					
					const context = that.getBindingContext(MODEL_NAME); 
					const { Werks, HuExt, Aufnr, Matnr, Menge, Lgort, Batch	} = context.getProperty();
					
					const payload = {
						Werks,
						HuExt,
						Aufnr,
						Matnr,
						Menge: Menge.toString(),
						Lgort,
						Batch,
						LgortInputProd: undefined
					};
					
					const path = "/IssueSet";
					model.create(path, payload, {
						success: function(oData){
							
							const { Msg } = oData;
							
							if (!Msg){
								
								busyDialog.close();
								const ttl = bundle.getProperty("issueSuccess");
								const msg = bundle.getProperty("issueSuccess") + `\n${Msg}` ;
								const dialog = that.showBigDialog(ttl, msg); //show dialog
								setTimeout(() => dialog.close(), 3000); //close dialog after 3 sec
								
								//clear fields
								that.getId("issueProdOrder").setValue("");
								that.getId("issueMatNumber").setValue("");
								that.getId("issueSloc").setValue("");
								that.getId("issueSlocName").setText("");
								that.getId("issueQty").setValue("0.000");
								
								setTimeout(() => MessageToast.show(bundle.getProperty("resetFieldText")), 3500); //close dialog after 3.5 sec
								
							} else {
								busyDialog.close();
								showError(Msg);
							}
							
						},
						error: function(error){
							busyDialog.close();
							showError(error.message);
						}
					});
				
				}
				
			};
			
		},
		
		reversals: function() {
			
			const that = this;
			const MODEL_NAME ="Z_PP_PROD_REVERSALS_SRV";
			const model = this.getModel(MODEL_NAME);
			const bundle = this.getResourceBundle();
			const state = this.state.prodOrderIssue;
			
			return {
				
				onProdOperationReversalSet: function(){
					
				}
				
			}
			
		},
		
		/**** Events ***/
		
		//confirm prod
		onHandProdConfirmPress: function(){
			this.prodOrderConfirm().getBarcodePrefixSet();
		},
		
		onChangeConfirmBarcode: function(oEvent) {
			const barcode = oEvent.getParameter("value");
			this.prodOrderConfirm().getBarcodePrefixSet(barcode, oEvent);
		},
		
		//issue prod
		onChangeIssueBarcode: function(oEvent){
			const barcode = oEvent.getParameter("value");
			this.prodOrderIssue().handleBarcodeInput(barcode, oEvent);
		},
		
		onPressIssueProdOrder: function(){
			this.prodOrderIssue().issueProductionOrder();
		}
		
		
	});
	
});