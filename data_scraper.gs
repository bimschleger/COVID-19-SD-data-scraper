/*

A program to scrape data form the san diego site for reporting COVID-19 cases.

https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html


*/


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

Gets the 'Updated [Month] DD, YYYY" form the San Diego website.

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

Parses the HTML table for row values, and sends the values into Sheets.

@param {object} dateSiteUpdated - datetime object for the last time the San Diego site was updated
@param {object} urlText - all of the HTML text from the San Diego government website

*/


function parseTable(dateSiteUpdated, urlText) {
  
  var regexTable = /<table[\s\S]*?\/table>/;
  var tableText = urlText.match(regexTable);
  
  var document = XmlService.parse(tableText[0]);
  
  var root = document.getRootElement();
  var tableBody = root.getChildren();  // Get the tableBody tag from the HTML/XML
  var tableRows = tableBody[0].getChildren(); // Get an array of each XML table row (tr)
  
  var rows = [];  // Defines the empty array in which we put each table row
  
  // For each table row, get column content
  for (i = 3; i < tableRows.length; i++) {  //start on the first row with all the columns
    
    var tableColumns = tableRows[i].getChildren();  // Gets an array of all the columns for the row
    
    var rowTitle = getHtmlRowText(tableColumns[0]);  // Gets the value of the first column
    var rowValue = getHtmlRowText(tableColumns[tableColumns.length -1]); // Gets the value of the last column, which is "Total"
    
    if (rowValue.trim() != "") { // Gets rid of the weird single " " value for header rows
      var row = [dateSiteUpdated, rowTitle, rowValue];
      rows.push(row);
    }
  }
  
  // Send the scraped data into Google Sheets
  addToSpreadsheet(rows);
  
  // Update the age range and severity charts and save them to Google Drive
  getChartAsPng(dateSiteUpdated, "age");
  getChartAsPng(dateSiteUpdated, "severity");
}


/*

Find the value of a table column, even if the value is wrapped in <b>

@param {strign} td - a table column of XML data
@return {string} col - the contents of the table column

*/

function getHtmlRowText(td) {
  
  if (td.getChildren().length == 1) { // Checks to see if the XML node has a child element. Note: only works for 1 child level
    var col = td.getChildren()[0].getText();
  } 
  else {
    var col = td.getText();  // Handles all <td> tags without a child <b> tag
  }
  
  return col; // Returns the text value of the column
}


/*

Sends the scraped row data into Google Sheets

@param {array} rows - an array of row data that was scraped from the San Diego site.

*/

function addToSpreadsheet(rows) {

  var sheetId = "1YoJrGvn80VYjKY0--pxEr9gZPqacRm0Hdf79am1ASj0";
  var sheetName = "data";
  
  var sheet = SpreadsheetApp.openById(sheetId);
  var ss = sheet.getSheetByName(sheetName);
  
  var startingRow = ss.getLastRow() + 1;
  var startingColumn = 1;
  var numRows = rows.length;  // Number of rows in the dataset
  var numColumns = rows[0].length;  // Number of columns in each row
  
  ss.getRange(startingRow, startingColumn, numRows, numColumns).setValues(rows);  
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


/*

Grabs the CSV data from the New York Times, and filters by the FIPS codes for San Diego, DuPage, and Allen counties

*/

function getNytCountyData() {
  
  var csvUrl = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv";
  var csvContent = UrlFetchApp.fetch(csvUrl).getContentText();
  var csvData = Utilities.parseCsv(csvContent);
  
  var relevantCounties = ["06073", "18003", "17043"];  // TODO: get these into classes, with population, density, FIPS, and name
  var csvDataFiltered = [];
  
  csvData.forEach( function (row){
    
    if (relevantCounties.includes(row[3])) {
      csvDataFiltered.push(row);
      Logger.log(row);
    }
  });
}


/* Want to get the net daily cases by age, gender, and severity, relative to the first positive case.
need to get the date of the first positive
For each county
determine total cases from the day before ineach category
get today's value for each category
subtract yesterdays cumulative from today's cumulative
add data 

[ date, county, FIPS, total positives, [ages], [genders], [severities] ]

*/
  