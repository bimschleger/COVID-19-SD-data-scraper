/*

one-time create chart

- age range stacked filled line chart
- single line chart with overall cases
- chart for hospitalized vs deaths
- distribution of male female over time
- 

*/

// Line chart to display total cases

// cumulative chart
/*

remove minor vertical axes
remove minor horizontal axes
remove data labels
add total data labels

*/


/*

Opens the the table chart from Spreadsheet, given the name of the sheet, and saves is as a PNG in Google Drive.

*/

function getChartAsPng(dateSiteUpdated, sheetName) {
  
  var sheetId = "1YoJrGvn80VYjKY0--pxEr9gZPqacRm0Hdf79am1ASj0";
  
  var sheet = SpreadsheetApp.openById(sheetId)
  var ss = sheet.getSheetByName(sheetName);
  
  var chart = ss.getCharts()[0]; // Gets the first chart on the pivot sheet
  
  chart = chart.modify()
    .setOption('width', 800)
    .setOption('height', 480)
    .build();
  
    // TODO update chart to remove gridlines, or at least fix the weird intervals when there are only two dates
  ss.updateChart(chart);
  
  var chart_blob = chart.getBlob();
  
  var driveFolder = DriveApp.getFolderById("1tqad55K2orLHCCFjNYqieE2uujAfEU-S");
  var file = driveFolder.createFile(chart_blob);
  
  var dateString = formatDate(dateSiteUpdated);
  
  file.setName("Coronavirus-SanDiego-" + dateString + "-" + sheetName);
  
}
