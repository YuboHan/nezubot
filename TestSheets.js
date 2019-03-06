
const googleAuth = require('./src/GoogleAuth.js')
const {google} = require('googleapis')
const fs = require('fs')
const riotHelper = require('./src/RiotHelper.js')

// Authorize a client with credentials, then call the Google Sheets API.
googleAuth.authorize(updateSheet)

function setColumnWidths(requests, sheetId, columnsToUpdate)
{
    requests.push(
    {
        'updateSheetProperties' : {
            'properties' : {
                'sheetId' : sheetId,
                'gridProperties' : {'columnCount' : columnsToUpdate[columnsToUpdate.length - 1].end},
            },
            'fields' : 'gridProperties.columnCount',
            // 'title' :
        }
    })

    columnsToUpdate.forEach(col =>
    {
        requests.push(
        {
            'updateDimensionProperties' : {
                'range' : {
                    'sheetId'    : sheetId,
                    'dimension'  : 'COLUMNS',
                    'startIndex' : col.start,
                    'endIndex'   : col.end
                },
                'properties' : {
                    'pixelSize' : col.pixelSize
                },
                'fields' : 'pixelSize'
            }
        })
    })
}

function shadeColumnsBlackInRow(requests, sheetId, row, blackColumns)
{
    blackColumns.forEach(col =>
    {
        requests.push(
        {
            'updateCells' : {
                'rows' : [
                    {
                        'values' : [
                            {
                                'userEnteredFormat' : {
                                    'backgroundColor' : {'red' : 0.0, 'green' : 0.0, 'blue' : 0.0}
                                }
                            }
                        ]
                    }
                ],
                'fields' : 'userEnteredFormat.backgroundColor',
                'start' : {
                    'sheetId' : sheetId,
                    'rowIndex' : row,
                    'columnIndex' : col
                }
            }
        })
    })

    requests.push()
}

function writeCell(requests, sheetId, name, row, col, fontColor={'red' : 0.0, 'green' : 0.0, 'blue' : 0.0},
                   fontSize=10, bold=false, italic=false, underline=false)
{
    requests.push(
    {
        'updateCells' : {
            'rows' : [
                {
                    'values' : [
                        {
                            'userEnteredValue' : {'stringValue' : name},
                            'userEnteredFormat' : {
                                'horizontalAlignment' : 'CENTER',
                                'wrapStrategy' : 'OVERFLOW_CELL',
                                'textFormat' : {
                                    'foregroundColor' : fontColor,
                                    'fontFamily' : 'Arial',
                                    'fontSize' : fontSize,
                                    'bold' : bold,
                                    'italic' : italic,
                                    'underline' : underline
                                }
                            }
                        }
                    ]
                }
            ],
            'fields' : 'userEnteredValue.stringValue,userEnteredFormat(horizontalAlignment,wrapStrategy,textFormat)',
            'start' : {
                'sheetId' : sheetId,
                'rowIndex' : row,
                'columnIndex' : col
            }
        }
    })
}



function writeFirstRowHeaders(requests, sheetId, row, columnOffset)
{
    var headers = ['Kills', 'Deaths', 'Assists', 'KDA', 'CS', 'CS/M', 'Damage', 'Gold', 'Vision Score', 'Wards Placed', '', 'Kills', '', '', '', 
                   'Kills', '', 'Wards Placed', 'Vision Score', 'Gold', 'Damage', 'CS/M', 'CS', 'KDA', 'Assists', 'Deaths', 'Kills']
    var values = []

    headers.forEach(header =>
    {
        values.push(
        {
            'userEnteredValue' : {'stringValue' : header},
            'userEnteredFormat' : {
                'horizontalAlignment' : 'CENTER',
                'wrapStrategy' : 'OVERFLOW_CELL',
                'textFormat' : {
                    'foregroundColor' : {'red' : 0.0, 'green' : 0.0, 'blue' : 0.0},
                    'fontFamily' : 'Arial',
                    'fontSize' : 10,
                    'bold' : true,
                    'italic' : false,
                    'underline' : false
                }
            }
        })
    })

    requests.push(
    {
        'updateCells' : {
            'rows' : [{'values' : values}],
            'fields' : 'userEnteredValue.stringValue,userEnteredFormat(horizontalAlignment,wrapStrategy,textFormat)',
            'range' : {
                'sheetId' : sheetId,
                'startRowIndex' : row,
                'endRowIndex' : row + 1,
                'startColumnIndex' : columnOffset,
                'endColumnIndex' : columnOffset + headers.length
            }
        }
    })
}
function writeFirstRow(requests, sheetId, row, columnOffset, champion, kills, deaths, assists, cs, damage, gold, visionScore, wardsPlaced, reverseDirection)
{}




/**
 * Call this function to update spreadsheet
 */
function updateSheet(auth)
{
    const sheets = google.sheets({version: 'v4', auth})
    riotHelper.statsToJson('https://matchhistory.na.leagueoflegends.com/en/#match-details/NA1/2991203160/231667956?tab=overview', statsJson => 
    {
        let requests = []
        let sheetId = 1201951639

        let numRowsPerTeam = 37 // This is number of rows each team needs

        var columnWidths = [
            {start : 0,  end : 1,  pixelSize : 500},
            {start : 1,  end : 15, pixelSize : 100},
            {start : 15, end : 16, pixelSize : 200},
            {start : 16, end : 30, pixelSize : 100},
            {start : 30, end : 31, pixelSize : 500},
        ]
        setColumnWidths(requests, sheetId, columnWidths)

        // Per team (just one for now)
        shadeColumnsBlackInRow(requests, sheetId, 0, [0, 1, 12, 18, 29, 30])
        // Set team names
        writeCell(requests, sheetId, 'Blue Side', 0, 0, {'red' : 1.0, 'green' : 1.0, 'blue' : 1.0}, 35, true, true, true)
        writeCell(requests, sheetId, 'Red Side', 0, 30, {'red' : 1.0, 'green' : 1.0, 'blue' : 1.0}, 35, true, true, true)

        shadeColumnsBlackInRow(requests, sheetId, 1, [1, 12, 18, 29])
        writeFirstRowHeaders(requests, sheetId, 1, 2)




        // Submit batch request
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
    })
}






    // Create header row
    // requests.push(
    // {
    //     'repeatCell' : {
    //         'range' : {
    //             'sheetId' : sheetId,
    //             'startRowIndex' : 0,
    //             'endRowIndex' : 3,
    //             'startColumnIndex' : 1,
    //             'endColumnIndex' : 3
    //         },
    //         'cell' : {
    //             'userEnteredFormat' : {
    //                 'backgroundColor' : {'red' : 1.0, 'green' : 1.0, 'blue' : 0.8},
    //                 'horizontalAlignment' : 'CENTER',
    //                 'textFormat' : {
    //                     'foregroundColor' : {'red' : 0.0, 'green' : 0.0, 'blue' : 0.2},
    //                     'fontSize' : 18,
    //                     'bold' : true,
    //                     'underline' : true
    //                 }
    //             }
    //         },
    //         'fields' : 'userEnteredFormat(backgroundColor, textFormat, horizontalAlignment)'
    //     }
    // })
