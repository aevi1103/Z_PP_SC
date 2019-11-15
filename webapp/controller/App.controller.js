sap.ui.define([
	"./BaseController",
	"sap/m/MessageToast"
], function (BaseController, MessageToast) {
	"use strict";

	return BaseController.extend("com.federalmogul.sc.Z_PP_SC.controller.App", {
		
		onInit: function () {
		},
		
		onAfterRendering: function() {
			
			this.prodOrderConfirm().onProdOrderConfirmationSet();
			this.prodOrderIssue().onIssueSet();
			this.reversals().onProdOperationReversalSet();
			this.transfers().onTransferStockSet();
			
		},
		
		state: {
			prodOrderIssue: {
				isFirstScan: false
			}
		},
		
		/*
		=====================================================================================================
		Methods
		=====================================================================================================
		*/
		
		prodOrderConfirm: function() {
			
			const that = this;
			const MODEL_NAME ="Z_PP_PRODORDER_CONFIRM_SRV";
			const model = this.getModel(MODEL_NAME);
			const bundle = this.getResourceBundle();        
			
			const order = that.getId("confirmProdOrder");
			const qty = that.getId("confirmQty");
			
			const materialInput = that.getId("confirmMaterial");
			const slocInput = that.getId("confirmSloc");
			const slocNameInput = that.getId("confirmSlocName");
			
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
				
				getBarcodePrefixSet: function(barcode, oEvent) {
					
					const oBarcode = oEvent.getSource();
					const context = that.getBindingContext(MODEL_NAME); 

					const path = `/BarcodePrefixSet('${encodeURIComponent(barcode)}')`;
					model.read(path, {
						success: (odData) => {
							
							console.log(path, odData);
							
							const { Aufnr, Menge, Lgobe, Lgort, Matnr, Vornr} = odData;
							model.setProperty("Aufnr", Aufnr, context, false); //prod order
							model.setProperty("Matnr", Matnr, context, false); 
							model.setProperty("Menge", Menge, context, false);
							model.setProperty("Lgort", Lgort, context, false); 
							model.setProperty("Lgobe", Lgobe, context, false); 
							model.setProperty("Vornr", Vornr, context, false); 

							oBarcode.setValue("");
						
							that.setValueState(order, Aufnr, "Invalid production order.");
							that.setValueState(qty, Number(Menge), `Quantity entered (${Number(Menge)}) must be greater than zero.`);

						},
						error: (error) => {
							
							const ttl = bundle.getProperty("geMaterialError");
							const msg = bundle.getProperty("geMaterialErrorText");
							that.showBigDialog(ttl, `${msg}\n${error.message}`, false);
							
						}
						
					});
					
				},
				
				productionConfirmation: function(){
					
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
				
					const context = that.getBindingContext(MODEL_NAME); 
					const { Werks, HuExt, Aufnr, Vornr, Matnr, Menge, Lgort	} = context.getProperty();
					
					that.setValueState(order, order.getValue(), "Invalid production order.");
					that.setValueState(qty, Number(qty.getValue()), `Quantity entered (${Number(qty.getValue())}) must be greater than zero.`);
					
					const payload = {
						Werks,
						HuExt,
						Aufnr,
						Vornr,
						Matnr,
						Menge: Menge.toString(),
						Lgort,
						FlagFinalconf: undefined
					};
					
					if (Werks && Aufnr && Matnr && Number(Menge) && Lgort) {
						
						busyDialog.open();
						
						model.create(path, payload, {
							success: function(oData){
								
								const { Msg } = oData;
								
								if (!Msg) {
	
									const ttl = bundle.getProperty("confirmationSuccess");
									const msg = bundle.getProperty("confirmationSuccessText") + `\n${Msg}` ;
									const dialog = that.showBigDialog(ttl, msg);
									setTimeout(() => dialog.close(), 3000); //close dialog after 3 sec
	
									//reset fields
									that.resetField(order);
									that.resetField(qty);
									that.resetField(materialInput);
									that.resetField(slocInput);
									that.resetField(slocNameInput);
									
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

				}
				
			};
			
		},
		
		prodOrderIssue: function() {
			
			const that = this;
			const MODEL_NAME ="Z_PP_ISSUE_TO_PRODUCTION_SRV";
			const model = this.getModel(MODEL_NAME);
			const bundle = this.getResourceBundle();
			const state = this.state.prodOrderIssue;
			
			const orderInput = that.getId("issueProdOrder");
			const materialInput = that.getId("issueMatNumber");
			const slocInput = that.getId("issueSloc");
			const slocNameInput = that.getId("issueSlocName");
			const qtyInput = that.getId("issueQty");
			
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
							
							that.setValueState(orderInput, Aufnr, "Invalid production order.");
							that.setValueState(materialInput, Matnr, "Invalid material.");
							that.setValueState(slocInput, Lgort, "Invalid storage location.");
							that.setValueState(qtyInput, Number(Menge), `Quantity entered (${Number(Menge)}) must be greater than zero.`);
							
							
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

					const showError = (oDataMsg) => {
						const ttl = bundle.getProperty("issueError");
						const msg = bundle.getProperty("issueError") + `\n${oDataMsg}` ;
						that.showBigDialog(ttl, msg, false);
					};
					
					const context = that.getBindingContext(MODEL_NAME); 
					const { Werks, HuExt, Aufnr, Matnr, Menge, Lgort, Batch	} = context.getProperty();
					
					that.setValueState(orderInput, orderInput.getValue(), "Invalid production order.");
					that.setValueState(materialInput, materialInput.getValue(), "Invalid material.");
					that.setValueState(slocInput, slocInput.getValue(), "Invalid storage location.");
					that.setValueState(qtyInput, Number(qtyInput.getValue()), `Quantity entered (${Number(qtyInput.getValue())}) must be greater than zero.`);
					
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
					
					if (Werks && Matnr && Lgort && Number(Menge)) {
						
						busyDialog.open();
						
						const path = "/IssueSet";
						model.create(path, payload, {
							success: function(oData){
								
								const { Msg } = oData;
								
								if (!Msg){
									
									busyDialog.close();
									const ttl = bundle.getProperty("issueSuccess");
									const msg = bundle.getProperty("issueSuccessText") + `\n${Msg}` ;
									const dialog = that.showBigDialog(ttl, msg); //show dialog
									setTimeout(() => dialog.close(), 3000); //close dialog after 3 sec
									
									//reset fields
									that.resetField(orderInput);
									that.resetField(materialInput);
									that.resetField(slocInput);
									that.resetField(qtyInput);
									that.resetField(slocNameInput);
									
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
					
					
				
				}
				
			};
			
		},
		
		reversals: function() {
			
			const that = this;
			const MODEL_NAME ="Z_PP_PROD_REVERSALS_SRV";
			const model = this.getModel(MODEL_NAME);
			const bundle = this.getResourceBundle();
			
			const orderInput = that.getId("reverseProdOrder");
			const materialSelect = that.getId("reverseSelectMaterial");
			const qtyInput = that.getId("reverseQty");
			const batchSelect = that.getId("reverseBatchSelect");
			
			return {
				
				onProdOperationReversalSet: function(){
					
					const showWerkFail = () => {
						const ttl = bundle.getProperty("plantFailInit");
						const msg = bundle.getProperty("readPlantFailed");
						that.showBigDialog(ttl, msg, false);
					};
					
					const path = "/ProdOperationReversalSet(Werks='',Role='')";
					model.read(path, {
						success: function(oData){

							const { Werks, Role } = oData;
							
							if (Werks && Role){
								const oContextPath = `/ProdOperationReversalSet(Werks='${Werks}',Role='${Role}')`;
								const oContext = new sap.ui.model.Context(model, oContextPath);
								that.setBindingContext(oContext, MODEL_NAME);
							} else {
								showWerkFail();
							}
							
						},
						error: function(){
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
						success: (oData) => {
							
							const { Aufnr, HuExt, Matnr, Batch } = oData;
							model.setProperty("Aufnr", Aufnr, context, false); //prod order
							model.setProperty("HuExt", HuExt, context, false); //handling unit
							
							if (Aufnr) { this.getBOM(Matnr); }
							this.getBatches(Batch);
							
							oBarcode.setValue("");
							
							that.setValueState(orderInput, Aufnr, "Invalid production order.");
							that.setValueState(materialSelect, Matnr, "Invalid material.");
							that.setValueState(qtyInput, Number(qtyInput.getValue()), `Quantity entered (${Number(qtyInput.getValue())}) must be greater than zero.`);
							that.setValueState(batchSelect, Batch, "Invalid material.");
						},
						error: function () {
							showBarcodeFailure();
						}
					});
					
				},
				
				getBOM: function(material){
					
					const combo = that.getId("reverseSelectMaterial");
					const context = that.getBindingContext(MODEL_NAME); 
					const { Aufnr } = context.getProperty();
					const oFilter = new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.EQ, Aufnr);
					combo.getBinding("items").filter(oFilter);
					if(material !== ""){ model.setProperty("Matnr", material, context, false); }
					
				},
				
				getBatches: function(batchVal) {
				
					const batchLbl = that.getId("reverseBatchSelectLbl");
					const batch = that.getId("reverseBatchSelect");
					
					const context = that.getBindingContext(MODEL_NAME); 
					const { Matnr, Werks } = context.getProperty();
					
					const filterMaterial = new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, Matnr);
					const filterWerks = new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, Werks);
					
					if (batchVal){
						batchLbl.setVisible(true);
						batch.setVisible(true);
						
						if (batchVal !== "X") {
							const filterBatch = new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.EQ, batchVal);
							batch.getBinding("items").filter([filterMaterial, filterWerks, filterBatch]);
						} else {
							batch.getBinding("items").filter([filterMaterial, filterWerks]);
						}
						
						batch.setSelectedKey(batchVal);
						batch.setValue(batchVal);
						
					} else {
						batchLbl.setVisible(false);
						batch.setVisible(false);
					}

				},
				
				confirmReversal: function(){
					
					const showError = (oDataMsg) => {
						const ttl = bundle.getProperty("reverseFailureTitle");
						const msg = bundle.getProperty("reverseFailureText") + `\n${oDataMsg}` ;
						that.showBigDialog(ttl, msg, false);
					};
					
					const busyDialog = that.showBusyDialog(
												bundle.getProperty("BusyDialogTitle"),
												bundle.getProperty("BusyDialogText")
											);
					
					
					const context = that.getBindingContext(MODEL_NAME);
					const { Werks, Aufnr, Vornr, Menge, Matnr, Batch } = context.getProperty();
					const reverseRadioBtn = that.byId("reverseRadioBtn");
					const FlagRevtype = reverseRadioBtn.getSelectedIndex() === 0 ? "I" : "Y";
					
					that.setValueState(orderInput, orderInput.getValue(), "Invalid production order.");
					that.setValueState(materialSelect, materialSelect.getSelectedKey(), "Invalid material.");
					that.setValueState(qtyInput, Number(qtyInput.getValue()), `Quantity entered (${Number(qtyInput.getValue())}) must be greater than zero.`);
					that.setValueState(batchSelect, batchSelect.getSelectedKey(), "Invalid material.");
					
					const payload = {
						Werks,
						Aufnr,
						Vornr,
						Menge: Menge.toString(),
						Matnr,
						Batch,
						FlagRevtype
					};
					
					//todo: batch
					if (Werks && Aufnr && Number(Menge) && Matnr && FlagRevtype) {
						
						busyDialog.open();
						
						const path = "/ProdOperationReversalSet";
						model.create(path, payload, {
							success: function(oData){
								
								const { Msg } = oData;
								
								if (!Msg) {
									
									busyDialog.close();
									const ttl = bundle.getProperty("reverseSuccessTitle");
									const msg = bundle.getProperty("reverseSuccessText") + `\n${Msg}` ;
									const dialog = that.showBigDialog(ttl, msg); //show dialog
									setTimeout(() => dialog.close(), 3000); //close dialog after 3 sec
									
									//reset fields
									that.resetField(orderInput);
									that.resetField(materialSelect);
									that.resetField(qtyInput);
									
									if (oData.Batch) {
										that.resetField(batchSelect);
										that.getId("reverseBatchSelect").getBinding("items").filter(null);
									}
									
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
					
					
					
				}
				
			};
			
		},
		
		transfers: function() {
			
			const that = this;
			const MODEL_NAME ="ZRF_TRANSFER_STOCK_IM_SRV";
			const model = this.getModel(MODEL_NAME);
			const bundle = this.getResourceBundle();
			
			const material = that.getId("trMatNumber");
			const qty = that.getId("trQty");
			const slocFrom = that.getId("trFromSloc");
			const slocFromName = that.getId("trFromSlocName");
			const slocTo = that.getId("trToSloc");
			const slocToName = that.getId("trToSlocName");
			const batchInput = that.getId("transferBatchSelect");
			
			return {
				
				onTransferStockSet: function(){
					
					const showWerkFail = () => {
						const ttl = bundle.getProperty("plantFailInit");
						const msg = bundle.getProperty("readPlantFailed");
						that.showBigDialog(ttl, msg, false);
					};
					
					const path = "/TransferStockSet('')";
					model.read(path, {
						success: function(oData){
			
							const { Werks } = oData;
							if (Werks !== "0000"){
								const oContextPath = `/TransferStockSet('${Werks}')`;
								const oContext = new sap.ui.model.Context(model, oContextPath);
								that.setBindingContext(oContext, MODEL_NAME);
							} else {
								showWerkFail();
							}
							
						},
						error: function(){
							showWerkFail();
						}
					});
					
				},
				
				handleBarcodeInput: function(barcode, oEvent, fnCallback = () => {}, isSlocFrom = undefined){
					
					const context = that.getBindingContext(MODEL_NAME); 
					const path = `/BarcodePrefixSet('${encodeURIComponent(barcode)}')`;
					const oBarcode = typeof oEvent !== "undefined" ? oEvent.getSource() : oEvent;
					
					const showBarcodeFailure = () => {
						const ttl = bundle.getProperty("barcodeFailure");
						const msg = bundle.getProperty("barcodeFailureText") + barcode;
						that.showBigDialog(ttl, msg, false);
					};
					
					const setSlocValueState = (oSource, sValue) => {
						if (sValue) {
							oSource.setValueState("Success");
						} else {
							oSource.setValueState("Error");
							oSource.setValueStateText("Invalid storage location.");
						}
					};
					
					model.read(path, {
						success: (oData) => {
							
							const { 
								Matnr, //material
								Menge, //qty
								Lgort, //sloc from
								LgortN, //sloc to
								Lgobe, //sloc from name
								Batch 
							} = oData;
							
							//check is material input is empty, if yes update value
							if (typeof isSlocFrom !== "boolean" && !material.getValue()) { 
								model.setProperty("Matnr", Matnr, context, false);
								setSlocValueState(material, Matnr);
							} 
							
							//check is qty input is empty, if yes update value
							if (typeof isSlocFrom !== "boolean" && !Number(qty.getValue())) { 
								model.setProperty("Menge", Menge, context, false); 
								setSlocValueState(qty, Menge);
							} 
							
							if (typeof isSlocFrom !== "boolean") { //handle barcode scan
								
								if(Lgort && !LgortN){ //check if sloc from is not empty and sloc to is empty
							
									if(!slocFromName.getValue()){ //check is input sloc from is not empty
									
										model.setProperty("LgortVon", Lgort, context, false); //sloc from
										slocFromName.setValue(Lgobe); //sloc from name
										setSlocValueState(slocFrom, Lgobe); //assign value state
										
									} else {
										model.setProperty("LgortNach", Lgort, context, false); //sloc to
										slocToName.setValue(Lgobe); //sloc to name
										setSlocValueState(slocTo, Lgobe); //assign value state
										
									}
									
								} else if (Lgort && LgortN){
									
									model.setProperty("LgortVon", Lgort, context, false); //sloc from
									slocFromName.setValue(Lgobe); //sloc from name
									
									model.setProperty("LgortNach", LgortN, context, false); //sloc from
									slocToName.setValue("");
									
									setTimeout(() => slocToName.focus(), 900);
									
								}
								
							} else { //handle sloc on change
								
								if (isSlocFrom){
									slocFromName.setValue("");
									model.setProperty("LgortVon", Lgort, context, false); //sloc from
									slocFromName.setValue(Lgobe); //sloc from name
								} else {
									slocToName.setValue("");
									model.setProperty("LgortNach", Lgort, context, false); //sloc to
									slocToName.setValue(Lgobe); //sloc to name
								}
								
							}
							
							this.getBatch(Batch);
							if (oEvent) { oBarcode.setValue(""); }
							
							fnCallback(oData);
							
						},
						error: function () {
							
							if (typeof isSlocFrom === "boolean") {
								if (isSlocFrom){
									slocFromName.setValue("");
									model.setProperty("LgortVon", "", context, false); //sloc from
									slocFromName.setValue(""); //sloc from name
									setSlocValueState(slocFrom, ""); //assign value state
								} else {
									slocToName.setValue("");
									model.setProperty("LgortNach", "", context, false); //sloc to
									slocToName.setValue(""); //sloc to name
									setSlocValueState(slocTo, ""); //assign value state
								}
							} else {
								showBarcodeFailure();
							}

						}
					});
					
				},
				
				getBatch: function(batchVal){
					
					const batchLbl = that.getId("transferBatchSelectLbl");
					const batch = that.getId("transferBatchSelect");
					
					const context = that.getBindingContext(MODEL_NAME); 
					const { Matnr, Werks } = context.getProperty();
					
					const filterMaterial = new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, Matnr);
					const filterWerks = new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, Werks);
					
					if (batchVal){
						batchLbl.setVisible(true);
						batch.setVisible(true);
						
						if (batchVal !== "X") {
							const filterBatch = new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.EQ, batchVal);
							batch.getBinding("items").filter([filterMaterial, filterWerks, filterBatch]);
						} else {
							batch.getBinding("items").filter([filterMaterial, filterWerks]);
						}
						
						batch.setSelectedKey(batchVal);
						batch.setValue(batchVal);
						
					} else {
						batchLbl.setVisible(false);
						batch.setVisible(false);
					}
					
				},
				
				confirmTransfer: function(){
					
					const showError = (oDataMsg) => {
						const ttl = bundle.getProperty("transferFailureTitle");
						const msg = bundle.getProperty("transferFailureText") + `\n${oDataMsg}` ;
						that.showBigDialog(ttl, msg, false);
					};
					
					const busyDialog = that.showBusyDialog(
												bundle.getProperty("BusyDialogTitle"),
												bundle.getProperty("BusyDialogText")
											);
					
					that.setValueState(material, material.getValue(), "Invalid material.");
					that.setValueState(qty, Number(qty.getValue()), `Quantity entered (${Number(qty.getValue())}) must be greater than zero.`);
					that.setValueState(slocFrom, slocFrom.getValue(), "Invalid storage location (from).");
					that.setValueState(slocTo, slocTo.getValue(), "Invalid storage location (to).");
					that.setValueState(batchInput, batchInput.getSelectedKey(), "Invalid Batch.");
					
					const context = that.getBindingContext(MODEL_NAME);
					const { Werks, Matnr, Menge, LgortVon, LgortNach, Batch } = context.getProperty();
					
					//todo: batch
					if (Werks && Matnr && Number(Menge) && LgortVon && LgortNach) {
						
						busyDialog.open();
						
						const payload = {
							Werks,
							Bwart: "311",
							HuExt: undefined,
							Matnr,
							Menge: Menge.toString(),
							LgortVon,
							LgortNach,
							Batch
						};
						
						const path = "/TransferStockSet";
						model.create(path, payload, {
							success: function(oData) {
								
								const { Msg } = oData;
								
								if (!Msg){
									
									busyDialog.close();
									const ttl = bundle.getProperty("transferSuccessTitle");
									const msg = bundle.getProperty("transferSuccessText") + `\n${Msg}` ;
									const dialog = that.showBigDialog(ttl, msg); //show dialog
									setTimeout(() => dialog.close(), 3000); //close dialog after 3 sec
									
									//reset fields
									that.resetField(material);
									that.resetField(qty);
									that.resetField(slocFrom);
									that.resetField(slocFromName);
									that.resetField(slocTo);
									that.resetField(slocToName);
									that.resetField(batchInput);
									
									if (oData.Batch) {
										that.resetField(batchInput);
										that.getId("transferBatchSelect").getBinding("items").filter(null);
									}
									
									setTimeout(() => MessageToast.show(bundle.getProperty("resetFieldText")), 3500); //close dialog after 3.5 sec
									
								} else {
									busyDialog.close();
									showError();
								}
								
							},
							error: function(error){
								busyDialog.close();
								showError(error.message);
							}
						});
						
					}
				}
				
			};
			
		},
		
		/*
		=====================================================================================================
		Events
		=====================================================================================================
		*/
		
		/*
		Utils
		------------------------------------------------------------------------------------------------------
		*/
		checkIfQtyGreaterThanZero: function(oEvent){
			
			const source = oEvent.getSource();
			const qty = Number(oEvent.getParameter("value"));
			if (qty < 1){
				source.setValueState("Error");
				source.setValueStateText(`Quantity entered (${qty}) must be greater than zero.`);
			} else {
				source.setValueState("Success");
			}
			
		},
		
		onQtyChange: function(oEvent){
			this.checkIfQtyGreaterThanZero(oEvent);
		},
		
		/*
		Comfirm Prod
		------------------------------------------------------------------------------------------------------
		*/

		onPressComfirmScan: function(oEvent) {
			const barcode = oEvent.getParameter("value");
			this.prodOrderConfirm().getBarcodePrefixSet(barcode, oEvent);
		},
		
		onHandProdConfirmPress: function(){
			this.prodOrderConfirm().productionConfirmation();
		},
		
		/*
		issue Prod
		------------------------------------------------------------------------------------------------------
		*/
		onChangeIssueBarcode: function(oEvent){
			const barcode = oEvent.getParameter("value");
			this.prodOrderIssue().handleBarcodeInput(barcode, oEvent);
		},
		
		onPressIssueProdOrder: function(){
			this.prodOrderIssue().issueProductionOrder();
		},
		
		/*
		reversals
		------------------------------------------------------------------------------------------------------
		*/
		onRadioBtnChange: function(oEvent){
			
			const selectedIndex = oEvent.getParameters().selectedIndex; // 0 - reverse issue, 1 - reverse confirmed
			const material = this.getId("reverseSelectMaterial");
			const materialLabel = this.getId("reverseSelectMaterialLbl");
			
			// !!(selectedIndex) converts index to boolean, !(selectedIndex) reverse the value because we want to be the first index to be true otherwise false
			material.setVisible(!(!!selectedIndex));
			materialLabel.setVisible(!(!!selectedIndex));
		},
		
		onChangeReverseBarcode: function (oEvent) {
			const barcode = oEvent.getParameter("value");
			this.reversals().handleBarcodeInput(barcode, oEvent);
		},
		
		onReversalMaterialChange: function(oEvent){
			
			const value = oEvent.getParameter("value");
			const source = oEvent.getSource();
			
			const items = source.getItems();
			const keys = items.map(item => item.getKey());
			const isInputExist = keys.includes(value);
			
			if (isInputExist){
				source.setValueState("None");
				source.setValueStateText("");
			}else {
				source.setValueState("Error");
				source.setValueStateText("Material does not exist");
			}

		},
		
		onPressReverse: function() {
			this.reversals().confirmReversal();
		},
		
		/*
		transfers
		------------------------------------------------------------------------------------------------------
		*/
		
		onChangeTransferScan: function(oEvent) {
			const barcode = oEvent.getParameter("value");
			this.transfers().handleBarcodeInput(barcode, oEvent);
		},
		
		onSlocChange: function(oEvent){
			
			const value = oEvent.getParameter("value");
			// if (!value) return;
			
			const { binding: { sPath } } = oEvent.getSource().getBindingInfo("value");
			const source = oEvent.getSource();
			
			let barcode = "";
			let bIsSlocFrom = false;
			
			switch(sPath){
				case "Matnr":
					barcode = `(91)${value}`;
					break;
				case "Menge":
					barcode = `(30)${value}`;
					break;
				case "LgortVon":
					barcode = `(414)${value}`;
					bIsSlocFrom = true;
					break;
				case "LgortNach":
					barcode = `(414)${value}`;
					bIsSlocFrom = false;
					break;
			}
			
			const fnCallback = oData => {
				const { Lgobe } = oData;
				this.setValueState(source, Lgobe, "Enter valid storage location");
			};
			
			this.transfers().handleBarcodeInput(barcode, undefined, fnCallback, bIsSlocFrom);        
			
		},
		
		onPressTransfer: function(){
			this.transfers().confirmTransfer();
		}
		
	});
	
});