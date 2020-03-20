/*

A program to scrape data form the san diego site for reporting COVID-19 cases.

https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html

Ideally, I will:

- scrape the table
- create an empty array
- generate a array for each row
- send the array of arrays into google sheets and log the data

probably need date in [date, age bracket, SD resident, Federal, non-SD resident]


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
  
  Logger.log("Root: " + root);
  
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
      if (tds[k].getChildren().length == 1) {
        // Handles all <td> tags with a child <b> tag
        var col = tds[k].getChildren()[0].getText();
        
      } else {
        // Handles all <td> tags without a child <b> tag
        var col = tds[k].getText();
        
      }
      row.push(col);
    }
    
    rows.push(row);
  }
  
  // Log each row of data
  rows.forEach(function(row) {
    
    Logger.log(row);
  });
}

function addToSpreadsheet(rows) {
  
  var sheet = SpreadsheetApp.openById("1YoJrGvn80VYjKY0--pxEr9gZPqacRm0Hdf79am1ASj0");
  var ss = sheet.getSheetByName("data");
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  
  // get a range that is starts on the last row of sheets data, and has the dimesions of the scraped data
  // once i get the range, then set the range with the rows values that were passed through
  // reference: https://script.google.com/a/bimschleger.com/d/1qLMbfwju23rISzJkDW4o2lcJPsKhnRVv1cQD8BBorNTGudzjizJ5bdOU/edit
  
}