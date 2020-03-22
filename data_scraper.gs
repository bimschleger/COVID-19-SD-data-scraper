/*

A program to scrape data form the san diego site for reporting COVID-19 cases.

https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html


*/



/*

Gets data form the San Diego government site. 
Scrape the data with numerical values.
Prepare a 2D array to pass to Spreadsheets as tabular data.

*/

function getData() {
  
  var url = 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html';
  var urlText = UrlFetchApp.fetch(url).getContentText();
  var today = new Date();
  
  var regexTable = /<table[\s\S]*?\/table>/;
  var tableText = urlText.match(regexTable);
  
  // Logger.log(tableText);
  
  var document = XmlService.parse(tableText[0]);
  var root = document.getRootElement();
  
  //Logger.log("Root: " + root);
  
  // Get the tbody tag from the HTML/XML
  var tbody = root.getChildren();
  
  // Defines the empty array in which we put each table row
  var rows = [];
  
  // Get an array of each XML table row (tr)
  var trs = tbody[0].getChildren();
  
  // For each table row, get column content
  for (i = 0; i < trs.length; i++) {
    
    // We place all of the column data in this row
    // Add in today's date, since we'll use this as a record in sheets
    var row = [today];
    
    // Gets an array of all the columns for the row
    var tds = trs[i].getChildren();
    
    // Grab the data from each column in each row
    for (k= 0; k < tds.length; k++) {
      
      // TODO: maybe figure out a way to only get the age range values?
      // TODO: Figure out a way to check if the Updated date on the website is greater than the max date value in sheets.
        // Maybe regex the first row in the table, search for "march 20, 2020", convert it to date, compare against max value?
        // Maybe even run the script like every 4 hours, always checking to see if the updated date is new?
      
      if (tds[k].getChildren().length == 1) {
        
        // Handles all <td> tags with a child <b> tag
        var col = tds[k].getChildren()[0].getText();
        
      } 
      else {
        // Handles all <td> tags without a child <b> tag
        var col = tds[k].getText();
      }
      row.push(col);
    }
    
    // Only add the row to rows if there are numerical values in the row. No headers.
    if (row[2] + row[3] + row[4] + row[5] > 0) {
      rows.push(row);
    }
  }
  
  // Send the scraped data into Google Sheets
  addToSpreadsheet(rows);
  
  // Update the age range chart and save it to Google Drive
  getChartAsPng();
}


/*

Sends the scraped row data into Google Sheets

@param {array} rows - an array of row data that was scraped from the San Diego site.

*/

function addToSpreadsheet(rows) {

  var sheet = SpreadsheetApp.openById("1YoJrGvn80VYjKY0--pxEr9gZPqacRm0Hdf79am1ASj0");
  var ss = sheet.getSheetByName("data");
  var startingRow = ss.getLastRow() + 1;
  var startingColumn = 1;
  var numRows = rows.length;
  var numColumns = 6;
  
  ss.getRange(startingRow, startingColumn, numRows, numColumns).setValues(rows);  
}


/*

Opens the Pivot table chat from Spreadsheet, saves is as a PNG in Google Drive

*/

function getChartAsPng() { // TODO: add 'sheet' and 'date' as input parameters
  
  var date = new Date(); // TODO: remove once I pass through the date from getData
  var sheet = SpreadsheetApp.openById("1YoJrGvn80VYjKY0--pxEr9gZPqacRm0Hdf79am1ASj0") // remove once i pass through the sheet from getData
  var ss = sheet.getSheetByName("pivot");
  
  var chart = ss.getCharts()[0];
  
  chart = chart.modify()
    .setOption('width', 800)
    .setOption('height', 480)
    .build();
  
    // TODO update chart to remove gridlines, or at least fix the weird intervals when there are only two dates
  ss.updateChart(chart);
  
  var chart_blob = chart.getBlob();
  
  var driveFolder = DriveApp.getFolderById("1tqad55K2orLHCCFjNYqieE2uujAfEU-S");
  var file = driveFolder.createFile(chart_blob);
  
  var dateString = formatDate(date);
  
  file.setName("Coronavirus-SanDiego-" + dateString);
  

  // get the url of the png in drive
  // include the url of the png in an email
  
}


/*

Formats the date of a chart into a YYYY-MM-DD format for use in a file name.

@return {string} dateString - YYYY-MM-DD formatted text for use in the filename of the chart PNG

*/

function formatDate() { // TODO: add 'date' as an input parameter
  
  var date = new Date(); // TODO:  remove this and accept 'date' as in input parameter
  var year = cleanSingleDigitTime(date.getFullYear());
  var month = cleanSingleDigitTime(date.getMonth() + 1);
  var day = cleanSingleDigitTime(date.getDate());
  
  var dateString = year + "-" + month + "-" + day;
  // return date_string;
  
  return dateString;
}


/*

Enforces a leading 0 for a date value, like month or day.

@param {int} time - Value for a month or day that might not have a leading zero
@return {string} time - Value for a month or day that has a leading zero

*/

function cleanSingleDigitTime(time) {
  if (time < 10) {
      time = "0" + time;
    };
  return time; 
}