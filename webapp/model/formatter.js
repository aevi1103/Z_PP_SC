sap.ui.define([], function () {
	"use strict";

	return {

		numberUnit : function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},
		
		numberUnitNoDecimal : function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(0);
		},
		
		formatTimeInstance : function(oTime){
			// SAPUI5 formatters
			var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance();
			// timezoneOffset is in hours convert to milliseconds
			var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
			// format date and time to strings offsetting to GMT
			var timeStr = timeFormat.format(new Date(oTime.ms + TZOffsetMs));  //11:00 AM
			var parsedTime = new Date(timeFormat.parse(timeStr).getTime() - TZOffsetMs); //39600000
			
			return parsedTime.getUTCHours() + ":" + parsedTime.getUTCMinutes();
		}
		

	};

});