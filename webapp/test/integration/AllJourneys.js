/* global QUnit*/

sap.ui.define([
	"sap/ui/test/Opa5",
	"com/federalmogul/sc/Z_PP_SC/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/federalmogul/sc/Z_PP_SC/test/integration/pages/App",
	"com/federalmogul/sc/Z_PP_SC/test/integration/navigationJourney"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.federalmogul.sc.Z_PP_SC.view.",
		autoWait: true
	});
});