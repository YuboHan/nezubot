const googleAuth = require('./GoogleAuth.js')
const {google} = require('googleapis')
const fileHelper = require('./FileHelper.js')
const riotHelper = require('./RiotHelper.js')

module.exports = {
    getIdsFromURL : function(URL)
    {
        let tmp = URL.split('/spreadsheets/d/')

        if (tmp.length != 2)
        {
            throw 'Error: Cannot parse URL \'' + URL + '\''
        }

        let spreadsheetId = tmp[1].split('/')[0]
        let sheetId = URL.split('gid=')[1]

        return {
            'spreadsheet' : spreadsheetId,
            'sheet' : sheetId
        }
    },

    formatJsonAndPublishToSheets : function(id, gamesJson)
    {
        googleAuth.authorizeSpreadsheets(_formatResultsToSheets, 
                                         {'id' : id, 'gamesJson' : gamesJson})
    }
}

/**
 * To sheet coordinates. Converts col, row to google sheet coordinates
 */
function _tsc(row, col)
{
    var mapping = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
                   'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG']

    return mapping[col] + (row+1).toString()
}

function _setSheetSize(requests, sheetId)
{
    let columnWidths = [
        {start : 0,  end : 1,  pixelSize : 300},
        {start : 1,  end : 2,  pixelSize : 500},
        {start : 2,  end : 16, pixelSize : 120},
        {start : 16, end : 17, pixelSize : 200},
        {start : 17, end : 31, pixelSize : 120},
        {start : 31, end : 32, pixelSize : 500},
        {start : 32, end : 33, pixelSize : 300},
    ]

    requests.push(
    {
        'updateSheetProperties' : {
            'properties' : {
                'sheetId' : sheetId,
                'gridProperties' : {
                    'columnCount' : columnWidths[columnWidths.length - 1].end
                },
            },
            'fields' : 'gridProperties.columnCount'
        }
    })

    columnWidths.forEach(col =>
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

function _setBorderColors(requests, sheetId, ro)
{
    // Set background colors (1 is black, 0 is white)
    let colors = [
        [1,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,1],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]

    let rows = []
    for (let i in colors)
    {
        let values = []
        for (let j in colors[i])
        {
            let colorSchema = {
                'red'   : 1.0 - colors[i][j], 
                'green' : 1.0 - colors[i][j], 
                'blue'  : 1.0 - colors[i][j]
            }

            values.push(
            {
                'userEnteredFormat' : {
                    'backgroundColor' : colorSchema
                }
            })
        }
        rows.push({'values' : values})
    }

    requests.push(
    {
        'updateCells' : {
            'rows' : rows,
            'fields' : 'userEnteredFormat.backgroundColor',
            'range' : {
                'sheetId' : sheetId,
                'startRowIndex' : ro,
                'endRowIndex' : ro + colors.length,
                'startColumnIndex' : 0,
                'endColumnIndex' : colors[0].length
            }
        }
    })
}

function _colorCells(requests, sheetId, row, col, width, height, color={'red' : 0.5, 'green' : 0.0, 'blue' : 0.0})
{
    let rows = []
    for (let j = 0; j < height; j++)
    {
        let values = []
        for (let i = 0; i < width; i++)
        {
            values.push(
            {
                'userEnteredFormat' : {
                    'backgroundColor' : color
                }
            })
        }
        rows.push({'values' : values})
    }

    requests.push(
    {
        'updateCells' : {
            'rows' : rows,
            'fields' : 'userEnteredFormat.backgroundColor',
            'range' : {
                'sheetId' : sheetId,
                'startRowIndex' : row,
                'endRowIndex' : row + height,
                'startColumnIndex' : col,
                'endColumnIndex' : col + width
            }
        }
    })
}

function _mergeCells(requests, sheetId, row, col, width, height)
{
    requests.push(
    {
        "mergeCells": {
            "range": {
                "sheetId": sheetId,
                "startRowIndex": row,
                "endRowIndex": row + height,
                "startColumnIndex": col,
                "endColumnIndex": col + width
        },
        "mergeType": "MERGE_ALL"
      }
    })
}

function _writeCell(requests, sheetId, name, row, col, bold=false, italic=false, underline=false, fontSize=10, 
                    fontColor={'red' : 0.0, 'green' : 0.0, 'blue' : 0.0})
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
                                'textFormat' : {
                                    'foregroundColor' : fontColor,
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
            'fields' : 'userEnteredValue.stringValue,userEnteredFormat(textFormat,horizontalAlignment)',
            'start' : {
                'sheetId' : sheetId,
                'rowIndex' : row,
                'columnIndex' : col
            }
        }
    })
}

function _writeBlock(requests, sheetId, userEnteredValues, row, col, bold, numType)
{
    let rows = []
    for (let i in userEnteredValues)
    {
        let values = []
        for (let j in userEnteredValues[i])
        {
            let b = false
            if (bold != undefined && bold[i] != undefined && bold[i][j] == true)
            {
                b = true
            }

            var numberFormat = '#,##0'
            if (userEnteredValues[i][j]['formulaValue'] != undefined && userEnteredValues[i][j]['formulaValue'].indexOf('/') > -1)
            {
                numberFormat = '#,##0.00'
            }

            var numberType = 'NUMBER'
            if (numType != undefined && numType[i] != undefined && numType[i][j] == 'PERCENT')
            {
                numberType = 'PERCENT'
                numberFormat += '%'
            }

            values.push(
            {
                'userEnteredValue' : userEnteredValues[i][j],
                'userEnteredFormat' : {
                    'horizontalAlignment' : 'CENTER',
                    'textFormat' : {
                        'bold' : b
                    },
                    'numberFormat' : {
                        'type' : numberType,
                        'pattern' : numberFormat
                    }
                }
            })
        }
        rows.push({'values' : values})
    }

    requests.push(
    {
        'updateCells' : {
            'rows' : rows,
            'fields' : 'userEnteredValue, userEnteredFormat(horizontalAlignment,textFormat,numberFormat)',
            'range' : {
                'sheetId' : sheetId,
                'startRowIndex' : row,
                'endRowIndex' : row + userEnteredValues.length,
                'startColumnIndex' : col,
                'endColumnIndex' : col + userEnteredValues[0].length
            }
        }
    })
}

function _formatTeam(requests, sheetId, ro, gamesJson)
{
    _setBorderColors(requests, sheetId, ro)

    // Merge title cells
    _mergeCells(requests, sheetId, ro, 0, 2, 1)
    _mergeCells(requests, sheetId, ro, 31, 2, 1)

    // Merge icon cells
    _mergeCells(requests, sheetId, ro + 17, 0, 2, 12)
    _mergeCells(requests, sheetId, ro + 17, 31, 2, 12)

    // Get game time
    let s = gamesJson.stats.gameDuration
    let h = Math.floor(s / 3600)
    s = s - (h * 3600)
    let m = Math.floor(s / 60)
    s = s - (m * 60)

    // op.gg link
    _writeCell(requests, sheetId, 'op.gg link:', ro + 23, 28)
    _writeCell(requests, sheetId, gamesJson.gameUrl, ro + 23, 29)

    // Game winner
    let blueSideTeamName = gamesJson.teamObjs[1].fullName
    let redSideTeamName = gamesJson.teamObjs[1].fullName

    // color all cells loser color, and update winner after
    _colorCells(requests, sheetId, ro + 17, 0, 1, 1, gamesJson.teamObjs[1].color)
    _colorCells(requests, sheetId, ro + 17, 31, 1, 1, gamesJson.teamObjs[1].color)

    if (gamesJson.stats.teams[0].win.toLowerCase() == 'win')
    {
        blueSideTeamName = gamesJson.teamObjs[0].fullName
    _colorCells(requests, sheetId, ro + 17, 0, 1, 1, gamesJson.teamObjs[0].color)
    }
    else
    {
        redSideTeamName = gamesJson.teamObjs[0].fullName
    _colorCells(requests, sheetId, ro + 17, 31, 1, 1, gamesJson.teamObjs[0].color)
    }

    // 

    _writeCell(requests, sheetId, blueSideTeamName, ro, 0, true, true, true, 35, {'red' : 1.0, 'green' : 1.0, 'blue' : 1.0})
    _writeBlock(requests, sheetId, [[
        {'stringValue' : 'Game Time'}, 
        {'stringValue' : ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2)},
        {'stringValue' : gamesJson.teamObjs[0].id + ' Win'}
    ]], ro, 8, [[true, false, true]])


    _writeCell(requests, sheetId, 'Comparisons', ro, 16, true)
    _writeBlock(requests, sheetId, [[
        {'stringValue' : gamesJson.teamObjs[0].id + ' Win'},
        {'stringValue' : ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2)},
        {'stringValue' : 'Game Time'}, 
    ]], ro, 22, [[true, false, true]])
    _writeCell(requests, sheetId, redSideTeamName, ro, 31, true, true, true, 35, {'red' : 1.0, 'green' : 1.0, 'blue' : 1.0})

    // Blue side
    _writeBlock(requests, sheetId, [[
        {'stringValue' : 'Kills'},
        {'stringValue' : 'Deaths'},
        {'stringValue' : 'Assists'},
        {'stringValue' : 'KDA'},
        {'stringValue' : 'CS'},
        {'stringValue' : 'CS/M'},
        {'stringValue' : 'Damage'},
        {'stringValue' : 'Gold'},
        {'stringValue' : 'Vision Score'},
        {'stringValue' : 'Wards Placed'}
    ]], ro + 1, 3, [[true, true, true, true, true, true, true, true, true, true]])

    let uev = []
    for (let i = 0; i < 5; i++)
    {
        let participant = gamesJson.stats.participants[i]

        let uevRow = [
            {'stringValue' : riotHelper.getChampionNameByKey(participant.championId)},
            {'stringValue' : ''},
            {'numberValue' : participant.stats.kills},
            {'numberValue' : participant.stats.deaths},
            {'numberValue' : participant.stats.assists},
            {'formulaValue' : '=('+_tsc(2+i+ro,3)+'+'+_tsc(2+i+ro,5)+')/'+_tsc(2+i+ro,4)},
            {'numberValue' : participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled},
            {'formulaValue' : '='+_tsc(2+i+ro,7)+'/(TIMEVALUE('+_tsc(ro,9)+')*1440)'},
            {'numberValue' : participant.stats.totalDamageDealtToChampions},
            {'numberValue' : participant.stats.goldEarned},
            {'numberValue' : participant.stats.visionScore},
            {'numberValue' : participant.stats.wardsPlaced},
        ]
        uev.push(uevRow)
    }

    _writeBlock(requests, sheetId, uev, ro + 2, 1)
    _writeBlock(requests, sheetId, [[
        {'stringValue' : 'Total Kills'},
        {'stringValue' : 'Total Deaths'},
        {'stringValue' : 'Total Assists'},
        {'stringValue' : 'Average KDA'},
        {'stringValue' : 'Total CS'},
        {'stringValue' : 'Average CS/M'},
        {'stringValue' : 'Total Damage'},
        {'stringValue' : 'Total Gold'},
        {'stringValue' : 'Total Vision Score'},
        {'stringValue' : 'Total Wards Placed'},
    ]], ro + 7, 3, [[true, true, true, true, true, true, true, true, true, true]])

    _writeBlock(requests, sheetId, [[
        {'formulaValue' : '=sum('+_tsc(2+ro,3)+':'+_tsc(6+ro,3)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,4)+':'+_tsc(6+ro,4)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,5)+':'+_tsc(6+ro,5)+')'},
        {'formulaValue' : '=('+_tsc(8+ro,3)+'+'+_tsc(8+ro,5)+')/'+_tsc(8+ro,4)},
        {'formulaValue' : '=sum('+_tsc(2+ro,7)+':'+_tsc(6+ro,7)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,8)+':'+_tsc(6+ro,8)+')/5'},
        {'formulaValue' : '=sum('+_tsc(2+ro,9)+':'+_tsc(6+ro,9)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,10)+':'+_tsc(6+ro,10)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,11)+':'+_tsc(6+ro,11)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,12)+':'+_tsc(6+ro,12)+')'}
    ]], ro + 8, 3)

    _writeBlock(requests, sheetId, [[
        {'stringValue' : 'Kill Participation'},
        {'stringValue' : 'Damage/Min'},
        {'stringValue' : 'Damage/Death'},
        {'stringValue' : 'Damage %'},
        {'stringValue' : 'Damage/100 Gold'},
        {'stringValue' : 'Gold %'},
        {'stringValue' : 'Kill %'},
        {'stringValue' : 'Death %'},
        {'stringValue' : 'Assist %'},
        {'stringValue' : 'Wards/Min'}
    ]], ro + 10, 3, [[true, true, true, true, true, true, true, true, true, true]])

    uev = []
    var numType = []
    for (let i = 0; i < 5; i++)
    {
        let participant = gamesJson.stats.participants[i]

        let uevRow = [
            {'stringValue' : riotHelper.getChampionNameByKey(participant.championId)},
            {'stringValue' : ''},
            {'formulaValue' : '=('+_tsc(2+i+ro,3)+'+'+_tsc(2+i+ro,5)+')/'+_tsc(8+ro,3)},
            {'formulaValue' : '='+_tsc(2+i+ro,9)+'/(TIMEVALUE('+_tsc(0+ro,9)+')*1440)'},
            {'formulaValue' : '='+_tsc(2+i+ro,9)+'/'+_tsc(2+i+ro,4)},
            {'formulaValue' : '='+_tsc(2+i+ro,9)+'/'+_tsc(8+ro,9)},
            {'formulaValue' : '=('+_tsc(2+i+ro,9)+'/'+_tsc(2+i+ro,10)+')*100'},
            {'formulaValue' : '='+_tsc(2+i+ro,10)+'/'+_tsc(8+ro,10)},
            {'formulaValue' : '='+_tsc(2+i+ro,3)+'/'+_tsc(8+ro,3)},
            {'formulaValue' : '='+_tsc(2+i+ro,4)+'/'+_tsc(8+ro,4)},
            {'formulaValue' : '='+_tsc(2+i+ro,5)+'/'+_tsc(8+ro,5)},
            {'formulaValue' : '='+_tsc(2+i+ro,12)+'/(TIMEVALUE('+_tsc(0+ro,9)+')*1440)'},
        ]
        uev.push(uevRow)
        numType.push(['NUMBER', 'NUMBER', 'PERCENT', 'NUMBER', 'NUMBER', 'PERCENT', 'NUMBER', 'PERCENT', 'PERCENT', 'PERCENT', 'PERCENT', 'NUMBER'])
    }
    _writeBlock(requests, sheetId, uev, ro + 11, 1, [], numType)

    _writeBlock(requests, sheetId, [
        [{'stringValue' : 'Objectives'}, {'stringValue' : ''}],
        [{'stringValue' : ''}, {'stringValue' : ''}],
        [{'stringValue' : 'Dragons'}, {'numberValue' : gamesJson.stats.teams[0].dragonKills}],
        [{'stringValue' : 'Rift Herald'}, {'numberValue' : gamesJson.stats.teams[0].riftHeraldKills}],
        [{'stringValue' : 'Barons'}, {'numberValue' : gamesJson.stats.teams[0].baronKills}],
        [{'stringValue' : 'Towers'}, {'numberValue' : gamesJson.stats.teams[0].towerKills}],
        [{'stringValue' : 'Inhibitors'}, {'numberValue' : gamesJson.stats.teams[0].inhibitorKills}],
    ], ro + 17, 11, [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false]])


    // Red side
    _writeBlock(requests, sheetId, [[
        {'stringValue' : 'Wards Placed'},
        {'stringValue' : 'Vision Score'},
        {'stringValue' : 'Gold'},
        {'stringValue' : 'Damage'},
        {'stringValue' : 'CS/M'},
        {'stringValue' : 'CS'},
        {'stringValue' : 'KDA'},
        {'stringValue' : 'Assists'},
        {'stringValue' : 'Deaths'},
        {'stringValue' : 'Kills'}
    ]], ro + 1, 20, [[true, true, true, true, true, true, true, true, true, true]])

    uev = []
    numType = []
    for (let i = 0; i < 5; i++)
    {
        let participant = gamesJson.stats.participants[i + 5]

        let uevRow = [
            {'numberValue' : participant.stats.wardsPlaced},
            {'numberValue' : participant.stats.visionScore},
            {'numberValue' : participant.stats.goldEarned},
            {'numberValue' : participant.stats.totalDamageDealtToChampions},
            {'formulaValue' : '='+_tsc(2+i+ro,25)+'/(TIMEVALUE('+_tsc(0+ro,9)+')*1440)'},
            {'numberValue' : participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled},
            {'formulaValue' : '=('+_tsc(2+i+ro,27)+'+'+_tsc(2+i+ro,29)+')/'+_tsc(2+i+ro,28)},
            {'numberValue' : participant.stats.assists},
            {'numberValue' : participant.stats.deaths},
            {'numberValue' : participant.stats.kills},
            {'stringValue' : ''},
            {'stringValue' : riotHelper.getChampionNameByKey(participant.championId)},
        ]
        uev.push(uevRow)
    }
    _writeBlock(requests, sheetId, uev, ro + 2, 20, [], numType)

    _writeBlock(requests, sheetId, [[
        {'stringValue' : 'Total Wards Placed'},
        {'stringValue' : 'Total Vision Score'},
        {'stringValue' : 'Total Gold'},
        {'stringValue' : 'Total Damage'},
        {'stringValue' : 'Average CS/M'},
        {'stringValue' : 'Total CS'},
        {'stringValue' : 'Average KDA'},
        {'stringValue' : 'Total Assists'},
        {'stringValue' : 'Total Deaths'},
        {'stringValue' : 'Total Kills'},
    ]], ro + 7, 20, [[true, true, true, true, true, true, true, true, true, true]])

    _writeBlock(requests, sheetId, [[
        {'formulaValue' : '=sum('+_tsc(2+ro,20)+':'+_tsc(6+ro,20)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,21)+':'+_tsc(6+ro,21)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,22)+':'+_tsc(6+ro,22)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,23)+':'+_tsc(6+ro,23)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,24)+':'+_tsc(6+ro,24)+')/5'},
        {'formulaValue' : '=sum('+_tsc(2+ro,25)+':'+_tsc(6+ro,25)+')'},
        {'formulaValue' : '=('+_tsc(8+ro,27)+'+'+_tsc(8+ro,29)+')/'+_tsc(8+ro,28)},
        {'formulaValue' : '=sum('+_tsc(2+ro,27)+':'+_tsc(6+ro,27)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,28)+':'+_tsc(6+ro,28)+')'},
        {'formulaValue' : '=sum('+_tsc(2+ro,29)+':'+_tsc(6+ro,29)+')'},
    ]], ro + 8, 20)

    _writeBlock(requests, sheetId, [[
        {'stringValue' : 'Wards/Min'},
        {'stringValue' : 'Assist %'},
        {'stringValue' : 'Death %'},
        {'stringValue' : 'Kill %'},
        {'stringValue' : 'Gold %'},
        {'stringValue' : 'Damage/100 Gold'},
        {'stringValue' : 'Damage %'},
        {'stringValue' : 'Damage/Death'},
        {'stringValue' : 'Damage/Min'},
        {'stringValue' : 'Kill Participation'},
    ]], ro + 10, 20, [[true, true, true, true, true, true, true, true, true, true]])

    uev = []
    numType = []
    for (let i = 0; i < 5; i++)
    {
        let participant = gamesJson.stats.participants[i + 5]

        let uevRow = [
            {'formulaValue' : '='+_tsc(2+i+ro,20)+'/(TIMEVALUE('+_tsc(0+ro,9)+')*1440)'},
            {'formulaValue' : '='+_tsc(2+i+ro,27)+'/'+_tsc(8+ro,27)},
            {'formulaValue' : '='+_tsc(2+i+ro,28)+'/'+_tsc(8+ro,28)},
            {'formulaValue' : '='+_tsc(2+i+ro,29)+'/'+_tsc(8+ro,29)},
            {'formulaValue' : '='+_tsc(2+i+ro,22)+'/'+_tsc(8+ro,22)},
            {'formulaValue' : '=('+_tsc(2+i+ro,23)+'/'+_tsc(2+i+ro,22)+')*100'},
            {'formulaValue' : '='+_tsc(2+i+ro,23)+'/'+_tsc(8+ro,23)},
            {'formulaValue' : '='+_tsc(2+i+ro,23)+'/'+_tsc(8+ro,28)},
            {'formulaValue' : '='+_tsc(2+i+ro,23)+'/(TIMEVALUE('+_tsc(0+ro,9)+')*1440)'},
            {'formulaValue' : '=('+_tsc(2+i+ro,27)+'+'+_tsc(2+i+ro,29)+')/'+_tsc(8+ro,29)},
            {'stringValue' : ''},
            {'stringValue' : riotHelper.getChampionNameByKey(participant.championId)},
        ]
        uev.push(uevRow)
        numType.push(['NUMBER', 'PERCENT', 'PERCENT', 'PERCENT', 'PERCENT', 'NUMBER', 'PERCENT', 'NUMBER', 'NUMBER', 'PERCENT', 'NUMBER', 'NUMBER'])
    }
    _writeBlock(requests, sheetId, uev, ro + 11, 20, [], numType)
    
    _writeBlock(requests, sheetId, [
        [{'stringValue' : ''}, {'stringValue' : 'Objectives'}],
        [{'stringValue' : ''}, {'stringValue' : ''}],
        [{'numberValue' : gamesJson.stats.teams[1].dragonKills}, {'stringValue' : 'Dragons'}],
        [{'numberValue' : gamesJson.stats.teams[1].riftHeraldKills}, {'stringValue' : 'Rift Herald'}],
        [{'numberValue' : gamesJson.stats.teams[1].baronKills}, {'stringValue' : 'Barons'}],
        [{'numberValue' : gamesJson.stats.teams[1].towerKills}, {'stringValue' : 'Towers'}],
        [{'numberValue' : gamesJson.stats.teams[1].inhibitorKills}, {'stringValue' : 'Inhibitors'}]
    ], ro + 17, 20, [[false, true], [false, true], [false, true], [false, true], [false, true], [false, true], [false, true]])


    
    _writeBlock(requests, sheetId, [
        [{'stringValue' : 'Kills'}       , {'formulaValue' : '='+_tsc(8+ro,3)}  , {'formulaValue' : '=IF('+_tsc(1+ro,15)+'>'+_tsc(1+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}  , {'formulaValue' : '='+_tsc(8+ro,29)} , {'stringValue' : 'Kills'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'Deaths'}      , {'formulaValue' : '='+_tsc(8+ro,4)}  , {'formulaValue' : '=IF('+_tsc(3+ro,15)+'>'+_tsc(3+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}  , {'formulaValue' : '='+_tsc(8+ro,28)} , {'stringValue' : 'Deaths'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'Assists'}     , {'formulaValue' : '='+_tsc(8+ro,5)}  , {'formulaValue' : '=IF('+_tsc(5+ro,15)+'>'+_tsc(5+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}  , {'formulaValue' : '='+_tsc(8+ro,27)} , {'stringValue' : 'Assists'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'CS'}          , {'formulaValue' : '='+_tsc(8+ro,7)}  , {'formulaValue' : '=IF('+_tsc(7+ro,15)+'>'+_tsc(7+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}  , {'formulaValue' : '='+_tsc(8+ro,25)} , {'stringValue' : 'CS'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'CS/Min'}      , {'formulaValue' : '='+_tsc(8+ro,8)}  , {'formulaValue' : '=IF('+_tsc(9+ro,15)+'>'+_tsc(9+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}  , {'formulaValue' : '='+_tsc(8+ro,24)} , {'stringValue' : 'CS/Min'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'Damage'}      , {'formulaValue' : '='+_tsc(8+ro,9)}  , {'formulaValue' : '=IF('+_tsc(11+ro,15)+'>'+_tsc(11+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}, {'formulaValue' : '='+_tsc(8+ro,23)} , {'stringValue' : 'Damage'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'Gold'}        , {'formulaValue' : '='+_tsc(8+ro,10)} , {'formulaValue' : '=IF('+_tsc(13+ro,15)+'>'+_tsc(13+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}, {'formulaValue' : '='+_tsc(8+ro,22)} , {'stringValue' : 'Gold'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'Vision Score'}, {'formulaValue' : '='+_tsc(8+ro,11)} , {'formulaValue' : '=IF('+_tsc(15+ro,15)+'>'+_tsc(15+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}, {'formulaValue' : '='+_tsc(8+ro,21)} , {'stringValue' : 'Vision Score'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'Dragons'}     , {'formulaValue' : '='+_tsc(19+ro,12)}, {'formulaValue' : '=IF('+_tsc(17+ro,15)+'>'+_tsc(17+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}, {'formulaValue' : '='+_tsc(19+ro,20)}, {'stringValue' : 'Dragons'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'Barons'}      , {'formulaValue' : '='+_tsc(21+ro,12)}, {'formulaValue' : '=IF('+_tsc(19+ro,15)+'>'+_tsc(19+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}, {'formulaValue' : '='+_tsc(21+ro,20)}, {'stringValue' : 'Barons'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'Towers'}      , {'formulaValue' : '='+_tsc(22+ro,12)}, {'formulaValue' : '=IF('+_tsc(21+ro,15)+'>'+_tsc(21+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}, {'formulaValue' : '='+_tsc(22+ro,20)}, {'stringValue' : 'Towers'}],
        [{'stringValue' : ''}            , {'stringValue'  : ''}                , {'stringValue'  : ''}                                                                         , {'stringValue'  : ''}                , {'stringValue' : ''}],
        [{'stringValue' : 'Inhibitors'}  , {'formulaValue' : '='+_tsc(23+ro,12)}, {'formulaValue' : '=IF('+_tsc(23+ro,15)+'>'+_tsc(23+ro,17)+','+_tsc(ro,0)+','+_tsc(ro,31)+')'}, {'formulaValue' : '='+_tsc(23+ro,20)}, {'stringValue' : 'Inhibitors'}],
    ], ro + 1, 14, [
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
        [true, false, true, false, true],
    ])
}

function _formatResultsToSheets(auth, args)
{
    const sheetsApi = google.sheets({version: 'v4', auth})

    // Parse all arguments
    let sheetId = args.id.sheet
    let spreadsheetId = args.id.spreadsheet
    let requests = []

    let perTeamOffset = 30
    _setSheetSize(requests, sheetId)
    for (var i = 0; i < args.gamesJson.length; i++)
    {
        _formatTeam(requests, sheetId, perTeamOffset * i, args.gamesJson[i])
    }

    // Submit batch request
    sheetsApi.spreadsheets.batchUpdate(
    {
        spreadsheetId : spreadsheetId,
        resource : {requests}
    }), (err, response) =>
    {
        if (err)
        {
            // Handle error
            console.log(err)
        }
    }
}
