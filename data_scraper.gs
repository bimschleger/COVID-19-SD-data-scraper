/*

A program to scrape data form the san diego site for reporting COVID-19 cases.

https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html


*/


/*

Gets the 'Upated MM DD< YYYY" form the san diego website.

@param {string} urlText - All HTML text from the San Diego coronavirus website.
@return {object} dateSiteUpdated - datetime object for the last time the San Diego website was updated.

*/

function getDateSiteUpdated(urlText) {
  
  var regexDateUpdated = /Updated[\s\S]*?2020/g;
  
  var dateSiteUpdatedArray = urlText.match(regexDateUpdated); // returns array of matches
  
  var dateSiteUpdatedText = dateSiteUpdatedArray[0].split("Updated ");
  var dateSiteUpdated = new Date(dateSiteUpdatedText);
  
  return dateSiteUpdated;
}

/*

Gets and returns the most recent date that was submitted to the spreadsheet.

@return {object} date - Datetime object of the most recent date that was added to the spreadsheet

*/

function getDateSheetUpdated() {
  
  var sheetId = "1YoJrGvn80VYjKY0--pxEr9gZPqacRm0Hdf79am1ASj0";
  var sheetName = "data";
  
  var sheet = SpreadsheetApp.openById(sheetId);
  var ss = sheet.getSheetByName(sheetName);
  
  var numRows = ss.getLastRow() - 1; // To tell the range to collec tuntil the last row, but starting from row 2
  var data = ss.getRange(2, 1, numRows).getValues(); // Gets dates from all the data in the sheet
  var recentDate = data[data.length -1];
  
  var date = new Date(recentDate);
  
  return date;
  
}


/*

Determines if the date updated on the website is newer than the most recent date added into the spreadsheet

@param {object} siteDate - The date on which the San Diego site was most recently updated.
@param {object} recentSheetDate - The most recent date from the Google Spreadsheet
@return {boolean} - Boolean is the site date is newer than th emost recent Sheet date.

*/

function isSiteNewerThanRecentDate(siteDate, recentSheetDate) {

  if (siteDate > recentSheetDate) {
    return true;
  }
  else {
    return false;
  };
}


/*

Gets data form the San Diego government site.
If the site updated date is greater than the most recent date in the spreadsheet, parse the table.

*/

function getData() {
  
  var url = 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html';
  var urlText = UrlFetchApp.fetch(url).getContentText();
  
  var dateSiteUpdated = getDateSiteUpdated(urlText);
  var recentSheetDate = getDateSheetUpdated();
  var dateSiteUpdatedIsNew = isSiteNewerThanRecentDate(dateSiteUpdated, recentSheetDate);
  
  if (dateSiteUpdatedIsNew) {
    parseTable(dateSiteUpdated, urlText);
  } 
  else {
    Logger.log("Not a new date");
  } 
}


/*

Parses the HTML table for row values, and sends the values into Sheets.

@param {object} dateSiteUpdated - datetime object for the last time the San Diego site was updated
@param {object} urlText - all of the HTML text from the San Diego government website

*/


function parseTable(dateSiteUpdated, urlText) {
  
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
    // Add in dateSiteUpdated, since we'll use this as a record in sheets
    var row = [dateSiteUpdated];
    
    // Gets an array of all the columns for the row
    var tds = trs[i].getChildren();
    
    // Grab the data from each column in each row
    for (k= 0; k < tds.length; k++) {
      
      // TODO: maybe figure out a way to only get the age range values?
      
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
    // TODO  figur eout a way to get the zeroes in there
      // check for numm values instead of blanks.
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

Opens the Pivot table chat from Spreadsheet, saves is as a PNG in Google Drive.

*/

function getChartAsPng(dateSiteUpdated) { // TODO: add 'sheetId' as input parameter
  
  var sheetId = "1YoJrGvn80VYjKY0--pxEr9gZPqacRm0Hdf79am1ASj0";
  var sheetName = "pivot";
  
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
  
  file.setName("Coronavirus-SanDiego-" + dateString);
  
}


/*

Formats the date of a chart into a YYYY-MM-DD format for use in a file name.

@return {string} dateString - YYYY-MM-DD formatted text for use in the filename of the chart PNG

*/

function formatDate(date) {
  
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