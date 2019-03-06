
const googleAuth = require('./src/GoogleAuth.js')
const {google} = require('googleapis')
const fs = require('fs')

// Authorize a client with credentials, then call the Google Sheets API.
googleAuth.authorize(listMajors)

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
    const sheets = google.sheets({version: 'v4', auth})

    let requests = []
    let sheetId = 1201951639

    // Set column width
    requests.push(
    {
        'updateDimensionProperties' : {
            'range' : {
                'sheetId'    : sheetId,
                'dimension'  : 'COLUMNS',
                'startIndex' : 0,
                'endIndex'   : 1
            },
            'properties' : {
                'pixelSize' : 500
            },
            'fields' : 'pixelSize'
        }
    })

    // Create header row
    requests.push(
    {
        'repeatCell' : {
            'range' : {
                'sheetId' : sheetId,
                'startRowIndex' : 0,
                'endRowIndex' : 3,
                'startColumnIndex' : 1,
                'endColumnIndex' : 3
            },
            'cell' : {
                'userEnteredFormat' : {
                    'backgroundColor' : {'red' : 1.0, 'green' : 1.0, 'blue' : 0.8},
                    'horizontalAlignment' : 'CENTER',
                    'textFormat' : {
                        'foregroundColor' : {'red' : 0.0, 'green' : 0.0, 'blue' : 0.2},
                        'fontSize' : 18,
                        'bold' : true,
                        'underline' : true
                    }
                }
            },
            'fields' : 'userEnteredFormat(backgroundColor, textFormat, horizontalAlignment)'
        }
    })

    // Create some dummy values to fill in
    requests.push(
    {
        'updateCells' : {
            'range' : {
                'startColumnIndex' : 0,
                'endColumnIndex' : 2,
                'sheetId' : sheetId
            },
            'fields' : 'userEnteredValue',
            'rows' : [
                {
                    'values' : [
                        {'userEnteredValue' : {'formulaValue' : '=B1*2'}},
                        {'userEnteredValue' : {'numberValue' : 10}}
                    ]
                }
            ]
        }
    })

    const batchUpdateRequest = {requests}

    sheets.spreadsheets.batchUpdate(
    {
        spreadsheetId : '12Dzf_IcOBKRQLfLqhH1pxVGPeh0TI_Mm_Xx9RKnaIVs',
        resource : batchUpdateRequest
    }), (err, response) =>
    {
        if (err)
        {
            // Handle error
            console.log(err)
        }
    }
}