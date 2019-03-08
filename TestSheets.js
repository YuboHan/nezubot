
const googleAuth = require('./src/GoogleAuth.js')
const {google} = require('googleapis')
const fs = require('fs')
const riotHelper = require('./src/RiotHelper.js')

// Authorize a client with credentials, then call the Google Sheets API.
googleAuth.authorize(updateSheet)

function setSheetSize(requests, sheetId, columnsToUpdate, height)
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

function writeGameTime(requests, sheetId, time, row, col, fontColor={'red' : 0.0, 'green' : 0.0, 'blue' : 0.0},
                       fontSize=10, bold=false, italic=false, underline=false)
{
    let s = time
    let h = Math.floor(s / 3600)
    s = s - (h * 3600)
    let m = Math.floor(s / 60)
    s = s - (m * 60)

    writeCell(requests, sheetId, ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2), row, col,
              fontColor, fontSize, bold, italic, underline)
}

function writeRow(requests, sheetId, row, column, userEnteredValues, bold=false, numberType)
{
    var values = []
    var i = 0
    userEnteredValues.forEach(uev =>
    {
        var numberFormat = '#,###'
        if (uev['formulaValue'] != undefined && uev['formulaValue'].indexOf('/') > -1)
        {
            numberFormat = '##0.00'
        }

        var type = 'NUMBER'
        if (numberType != undefined && numberType[i] != undefined && numberType[i] != '')
        {
            type = numberType[i]
            numberFormat += '%'
        }

        values.push(
        {
            'userEnteredValue' : uev,
            'userEnteredFormat' : {
                'horizontalAlignment' : 'CENTER',
                'wrapStrategy' : 'OVERFLOW_CELL',
                'textFormat' : {
                    'foregroundColor' : {'red' : 0.0, 'green' : 0.0, 'blue' : 0.0},
                    'fontFamily' : 'Arial',
                    'fontSize' : 10,
                    'bold' : bold,
                    'italic' : false,
                    'underline' : false
                },
                'numberFormat' : {
                    'type' : type,
                    'pattern' : numberFormat
                }
            }
        })

        i += 1
    })

    requests.push(
    {
        'updateCells' : {
            'rows' : [{'values' : values}],
            'fields' : 'userEnteredValue.stringValue,userEnteredFormat(horizontalAlignment,wrapStrategy,textFormat,numberFormat)',
            'range' : {
                'sheetId' : sheetId,
                'startRowIndex' : row,
                'endRowIndex' : row + 1,
                'startColumnIndex' : column,
                'endColumnIndex' : column + values.length
            }
        }
    })
}

/**
 * Stands for column to letter
 */
function ctl(c)
{
    var mapping = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
                   'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG']

    return mapping[c]
}


function writeFirstRowHeaders(requests, sheetId, row, column)
{
    var userEnteredValues = [
        {'stringValue' : 'Kills'},
        {'stringValue' : 'Deaths'},
        {'stringValue' : 'Assists'},
        {'stringValue' : 'KDA'},
        {'stringValue' : 'CS'},
        {'stringValue' : 'CS/M'},
        {'stringValue' : 'Damage'},
        {'stringValue' : 'Gold'},
        {'stringValue' : 'Vision Score'},
        {'stringValue' : 'Wards Placed'},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : 'Wards Placed'},
        {'stringValue' : 'Vision Score'},
        {'stringValue' : 'Gold'},
        {'stringValue' : 'Damage'},
        {'stringValue' : 'CS/M'},
        {'stringValue' : 'CS'},
        {'stringValue' : 'KDA'},
        {'stringValue' : 'Assists'},
        {'stringValue' : 'Deaths'},
        {'stringValue' : 'Kills'},
    ]

    writeRow(requests, sheetId, row, column, userEnteredValues, true)
}

function writeFirstRowHeadersTotal(requests, sheetId, row, column)
{
    var userEnteredValues = [
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
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
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
    ]

    writeRow(requests, sheetId, row, column, userEnteredValues, true)
}

function writeSecondRowHeaders(requests, sheetId, row, column)
{
    var userEnteredValues = [
        {'stringValue' : 'Kill Participation'},
        {'stringValue' : 'Dmg/M'},
        {'stringValue' : 'Dmg/Death'},
        {'stringValue' : 'Dmg %'},
        {'stringValue' : 'Dmg/100 Gold'},
        {'stringValue' : 'Gold %'},
        {'stringValue' : 'Kill %'},
        {'stringValue' : 'Death %'},
        {'stringValue' : 'Assist %'},
        {'stringValue' : 'Wards/M'},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : 'Wards/M'},
        {'stringValue' : 'Assist %'},
        {'stringValue' : 'Death %'},
        {'stringValue' : 'Kill %'},
        {'stringValue' : 'Gold %'},
        {'stringValue' : 'Dmg/100 Gold'},
        {'stringValue' : 'Dmg %'},
        {'stringValue' : 'Dmg/Death'},
        {'stringValue' : 'Dmg/M'},
        {'stringValue' : 'Kill Participation'},
    ]

    writeRow(requests, sheetId, row, column, userEnteredValues, true)
}

function writeFirstRowBlueSide(requests, sheetId, row, column, participant, timeRow, timeCol)
{
    var userEnteredValues = [
        {'stringValue' : riotHelper.getChampionNameByKey(participant.championId)},
        {'stringValue' : ''},
        {'numberValue' : participant.stats.kills},
        {'numberValue' : participant.stats.deaths},
        {'numberValue' : participant.stats.assists},
        {'formulaValue' : '=('+ctl(column+2)+(row+1).toString()+'+'+ctl(column+4)+(row+1).toString()+')/'+ctl(column+3)+(row+1).toString()},
        {'numberValue' : participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled},
        {'formulaValue' : '='+ctl(column+6)+(row+1).toString()+'/(TIMEVALUE('+ctl(timeCol)+(timeRow+1).toString()+')*1440)'},
        {'numberValue' : participant.stats.totalDamageDealtToChampions},
        {'numberValue' : participant.stats.goldEarned},
        {'numberValue' : participant.stats.visionScore},
        {'numberValue' : participant.stats.wardsPlaced},
    ]
    writeRow(requests, sheetId, row, column, userEnteredValues)
}

function writeFirstRowRedSide(requests, sheetId, row, column, participant, timeRow, timeCol)
{
    var userEnteredValues = [
        {'numberValue' : participant.stats.wardsPlaced},
        {'numberValue' : participant.stats.visionScore},
        {'numberValue' : participant.stats.goldEarned},
        {'numberValue' : participant.stats.totalDamageDealtToChampions},
        {'formulaValue' : '='+ctl(column+5)+(row+1).toString()+'/(TIMEVALUE('+ctl(timeCol)+(timeRow+1).toString()+')*1440)'},
        {'numberValue' : participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled},
        {'formulaValue' : '=('+ctl(column+7)+(row+1).toString()+'+'+ctl(column+9)+(row+1).toString()+')/'+ctl(column+8)+(row+1).toString()},
        {'numberValue' : participant.stats.assists},
        {'numberValue' : participant.stats.deaths},
        {'numberValue' : participant.stats.kills},
        {'stringValue' : ''},
        {'stringValue' : riotHelper.getChampionNameByKey(participant.championId)},

    ]
    writeRow(requests, sheetId, row, column, userEnteredValues)
}

function writeFirstRowTotal(requests, sheetId, row, column, timeRow, timeCol)
{
    var userEnteredValues = [
        {'formulaValue' : '=sum('+ctl(column)+(row-5).toString()+':'+ctl(column)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+1)+(row-5).toString()+':'+ctl(column+1)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+2)+(row-5).toString()+':'+ctl(column+2)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+3)+(row-5).toString()+':'+ctl(column+3)+row.toString()+')/5'},
        {'formulaValue' : '=sum('+ctl(column+4)+(row-5).toString()+':'+ctl(column+4)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+5)+(row-5).toString()+':'+ctl(column+5)+row.toString()+')/5'},
        {'formulaValue' : '=sum('+ctl(column+6)+(row-5).toString()+':'+ctl(column+6)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+7)+(row-5).toString()+':'+ctl(column+7)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+8)+(row-5).toString()+':'+ctl(column+8)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+9)+(row-5).toString()+':'+ctl(column+9)+row.toString()+')'},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'formulaValue' : '=sum('+ctl(column+17)+(row-5).toString()+':'+ctl(column+17)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+18)+(row-5).toString()+':'+ctl(column+18)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+19)+(row-5).toString()+':'+ctl(column+19)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+20)+(row-5).toString()+':'+ctl(column+20)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+21)+(row-5).toString()+':'+ctl(column+21)+row.toString()+')/5'},
        {'formulaValue' : '=sum('+ctl(column+22)+(row-5).toString()+':'+ctl(column+22)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+23)+(row-5).toString()+':'+ctl(column+23)+row.toString()+')/5'},
        {'formulaValue' : '=sum('+ctl(column+24)+(row-5).toString()+':'+ctl(column+24)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+25)+(row-5).toString()+':'+ctl(column+25)+row.toString()+')'},
        {'formulaValue' : '=sum('+ctl(column+26)+(row-5).toString()+':'+ctl(column+26)+row.toString()+')'},
    ]
    writeRow(requests, sheetId, row, column, userEnteredValues)
}

function writeSecondRowBlueSide(requests, sheetId, row, column, participant, timeRow, timeCol, totalRow)
{
    var userEnteredValues = [
        {'stringValue' : riotHelper.getChampionNameByKey(participant.championId)},
        {'stringValue' : ''},
        {'formulaValue' : '=('+ctl(column+2)+(row-8).toString()+'+'+ctl(column+4)+(row-8)+')/'+ctl(column+2)+(totalRow+1).toString()},
        {'formulaValue' : '='+ctl(column+8)+(row-8).toString()+'/(TIMEVALUE('+ctl(timeCol)+(timeRow+1).toString()+')*1440)'},
        {'formulaValue' : '='+ctl(column+8)+(row-8).toString()+'/'+ctl(column+3)+(row-8).toString()},
        {'formulaValue' : '='+ctl(column+8)+(row-8).toString()+'/'+ctl(column+8)+(totalRow+1).toString()},
        {'formulaValue' : '=('+ctl(column+8)+(row-8).toString()+'/'+ctl(column+9)+(row-8).toString()+')*100'},
        {'formulaValue' : '='+ctl(column+9)+(row-8).toString()+'/'+ctl(column+9)+(totalRow+1).toString()},
        {'formulaValue' : '='+ctl(column+2)+(row-8).toString()+'/'+ctl(column+2)+(totalRow+1).toString()},
        {'formulaValue' : '='+ctl(column+3)+(row-8).toString()+'/'+ctl(column+3)+(totalRow+1).toString()},
        {'formulaValue' : '='+ctl(column+4)+(row-8).toString()+'/'+ctl(column+4)+(totalRow+1).toString()},
        {'formulaValue' : '='+ctl(column+11)+(row-8).toString()+'/(TIMEVALUE('+ctl(timeCol)+(timeRow+1).toString()+')*1440)'}
    ]

    var numberType = [
        '',
        '',
        'PERCENT',
        '',
        '',
        'PERCENT',
        '',
        'PERCENT',
        'PERCENT',
        'PERCENT',
        'PERCENT',
        '',
    ]

    writeRow(requests, sheetId, row, column, userEnteredValues, false, numberType)
}

function writeSecondRowRedSide(requests, sheetId, row, column, participant, timeRow, timeCol, totalRow)
{
    var userEnteredValues = [
        {'formulaValue' : '='+ctl(column)+(row-8).toString()+'/(TIMEVALUE('+ctl(timeCol)+(timeRow+1).toString()+')*1440)'},
        {'formulaValue' : '='+ctl(column+7)+(row-8).toString()+'/'+ctl(column+7)+(totalRow+1).toString()},
        {'formulaValue' : '='+ctl(column+8)+(row-8).toString()+'/'+ctl(column+8)+(totalRow+1).toString()},
        {'formulaValue' : '='+ctl(column+9)+(row-8).toString()+'/'+ctl(column+9)+(totalRow+1).toString()},
        {'formulaValue' : '='+ctl(column+2)+(row-8).toString()+'/'+ctl(column+2)+(totalRow+1).toString()},
        {'formulaValue' : '=('+ctl(column+3)+(row-8).toString()+'/'+ctl(column+2)+(row-8).toString()+')*100'},
        {'formulaValue' : '='+ctl(column+3)+(row-8).toString()+'/'+ctl(column+3)+(totalRow+1).toString()},
        {'formulaValue' : '='+ctl(column+3)+(row-8).toString()+'/'+ctl(column+8)+(row-8).toString()},
        {'formulaValue' : '='+ctl(column+3)+(row-8).toString()+'/(TIMEVALUE('+ctl(timeCol)+(timeRow+1).toString()+')*1440)'},
        {'formulaValue' : '=('+ctl(column+7)+(row-8).toString()+'+'+ctl(column+9)+(row-8).toString()+')/'+ctl(column+9)+(totalRow+1).toString()},
        {'stringValue' : ''},
        {'stringValue' : riotHelper.getChampionNameByKey(participant.championId)},
    ]

    var numberType = [
        '',
        'PERCENT',
        'PERCENT',
        'PERCENT',
        'PERCENT',
        '',
        'PERCENT',
        '',
        '',
        'PERCENT',
        '',
        '',
    ]

    writeRow(requests, sheetId, row, column, userEnteredValues, false, numberType)
}

function writeObjectives(requests, sheetId, row, column, team, timeRow, timeCol)
{
    var rows = []

    var userEnteredValues = [[
        {'stringValue' : 'Rift Herald'},
        {'numberValue' : team.riftHeraldKills},
        {'stringValue' : ''},
        {'stringValue' : ''},
        {'stringValue' : ''},
    ], [
        {'stringValue' : 'Dragons'},
        {'numberValue' : team.dragonKills},
        {'stringValue' : ''},
        {'stringValue' : 'Dragons/10 Min'},
        {'formulaValue' : '='+ctl(column+1)+(row+2).toString()+'/(TIMEVALUE('+ctl(timeCol)+(timeRow+1).toString()+')*144)'},
    ], [
        {'stringValue' : 'Barons'},
        {'numberValue' : team.baronKills},
        {'stringValue' : ''},
        {'stringValue' : 'Barons/10 Min'},
        {'formulaValue' : '='+ctl(column+1)+(row+3).toString()+'/(TIMEVALUE('+ctl(timeCol)+(timeRow+1).toString()+')*144)'},
    ], [
        {'stringValue' : 'Towers'},
        {'numberValue' : team.towerKills},
        {'stringValue' : ''},
        {'stringValue' : 'Towers/10 Min'},
        {'formulaValue' : '='+ctl(column+1)+(row+4).toString()+'/(TIMEVALUE('+ctl(timeCol)+(timeRow+1).toString()+')*144)'},
    ], [
        {'stringValue' : 'Inhibitors'},
        {'numberValue' : team.inhibitorKills},
        {'stringValue' : ''},
        {'stringValue' : 'Inhibitors/10 Min'},
        {'formulaValue' : '='+ctl(column+1)+(row+5).toString()+'/(TIMEVALUE('+ctl(timeCol)+(timeRow+1).toString()+')*144)'},
    ]]

    var bold = [true, false, false, true, false]
    var numPattern = ['#', '0', '#', '#', '##0.00']

    for (var i = 0; i < userEnteredValues.length; i++)
    {
        var rowProto = []
        for (var j = 0; j < 5; j++)
        {
            rowProto.push(
            {
                'userEnteredValue'  : userEnteredValues[i][j],
                'userEnteredFormat' : {
                    'textFormat'    : {'bold' : bold[j]},
                    'numberFormat'  : {'type' : 'NUMBER', 'pattern' : numPattern[j]}
                }
            })
        }
        rows.push({'values' : rowProto})
    }

    requests.push(
    {
        'updateCells' : {
            'rows' : rows,
            'fields' : 'userEnteredValue,userEnteredFormat(textFormat,numberFormat)',
            'range' : {
                'sheetId' : sheetId,
                'startRowIndex' : row,
                'endRowIndex' : row + userEnteredValues.length + 1,
                'startColumnIndex' : column,
                'endColumnIndex' : column + userEnteredValues[0].length
            }
        }
    })
}

/**
 * Currently hard coded and very prone to errors
 */
function writeComparisons(requests, sheetId, ro)
{
    var rows = []

    var userEnteredValues = [[
        {'stringValue' : 'Kills'},
        {'formulaValue' : '='+ctl(2)+(ro+9).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+2).toString()+'>'+ctl(16)+(ro+2).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(28)+(ro+9).toString()},
        {'stringValue' : 'Kills'}
    ], [
        {'stringValue' : 'Deaths'},
        {'formulaValue' : '='+ctl(3)+(ro+9).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+3).toString()+'>'+ctl(16)+(ro+3).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(27)+(ro+9).toString()},
        {'stringValue' : 'Deaths'}
    ], [
        {'stringValue' : 'Assists'},
        {'formulaValue' : '='+ctl(4)+(ro+9).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+4).toString()+'>'+ctl(16)+(ro+4).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(26)+(ro+9).toString()},
        {'stringValue' : 'Assists'}
    ], [
        {'stringValue' : 'Total CS'},
        {'formulaValue' : '='+ctl(6)+(ro+9).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+5).toString()+'>'+ctl(16)+(ro+5).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(24)+(ro+9).toString()},
        {'stringValue' : 'Total CS'}
    ], [
        {'stringValue' : 'CS/Min'},
        {'formulaValue' : '='+ctl(7)+(ro+9).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+6).toString()+'>'+ctl(16)+(ro+6).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(23)+(ro+9).toString()},
        {'stringValue' : 'CS/Min'}
    ], [
        {'stringValue' : 'Damage'},
        {'formulaValue' : '='+ctl(8)+(ro+9).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+7).toString()+'>'+ctl(16)+(ro+7).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(22)+(ro+9).toString()},
        {'stringValue' : 'Damage'}
    ], [
        {'stringValue' : 'Gold'},
        {'formulaValue' : '='+ctl(9)+(ro+9).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+8).toString()+'>'+ctl(16)+(ro+8).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(21)+(ro+9).toString()},
        {'stringValue' : 'Gold'}
    ], [
        {'stringValue' : 'Vision Score'},
        {'formulaValue' : '='+ctl(10)+(ro+9).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+9).toString()+'>'+ctl(16)+(ro+9).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(20)+(ro+9).toString()},
        {'stringValue' : 'Vision Score'}
    ], [
        {'stringValue' : 'Dragons'},
        {'formulaValue' : '='+ctl(8)+(ro+21).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+10).toString()+'>'+ctl(16)+(ro+10).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(20)+(ro+21).toString()},
        {'stringValue' : 'Dragons'}
    ], [
        {'stringValue' : 'Barons'},
        {'formulaValue' : '='+ctl(8)+(ro+22).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+11).toString()+'>'+ctl(16)+(ro+11).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(20)+(ro+22).toString()},
        {'stringValue' : 'Barons'}
    ], [
        {'stringValue' : 'Towers'},
        {'formulaValue' : '='+ctl(8)+(ro+23).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+12).toString()+'>'+ctl(16)+(ro+12).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(20)+(ro+23).toString()},
        {'stringValue' : 'Towers'}
    ], [
        {'stringValue' : 'Inhibitors'},
        {'formulaValue' : '='+ctl(8)+(ro+24).toString()},
        {'formulaValue' : '=IF('+ctl(14)+(ro+13).toString()+'>'+ctl(16)+(ro+13).toString()+','+ctl(0)+(ro+1).toString()+','+ctl(30)+(ro+1).toString()+')'},
        {'formulaValue' : '='+ctl(20)+(ro+24).toString()},
        {'stringValue' : 'Inhibitors'}
    ]]

    var bold = [true, false, true, false, true]

    for (var i = 0; i < userEnteredValues.length; i++)
    {
        var rowProto = []
        for (var j = 0; j < 5; j++)
        {
            rowProto.push(
            {
                'userEnteredValue' : userEnteredValues[i][j],
                'userEnteredFormat' : {
                    'textFormat' : {'bold' : bold[j]},
                    'horizontalAlignment' : 'CENTER',
                }
            })
        }
        rows.push({'values' : rowProto})
    }

    requests.push(
    {
        'updateCells' : {
            'rows' : rows,
            'fields' : 'userEnteredValue,userEnteredFormat(textFormat,numberFormat,horizontalAlignment)',
            'range' : {
                'sheetId' : sheetId,
                'startRowIndex' : ro + 1,
                'endRowIndex' : ro + userEnteredValues.length + 1,
                'startColumnIndex' : 13,
                'endColumnIndex' : 13 + userEnteredValues[0].length
            }
        }
    })
}


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
            {start : 1,  end : 15, pixelSize : 120},
            {start : 15, end : 16, pixelSize : 200},
            {start : 16, end : 30, pixelSize : 120},
            {start : 30, end : 31, pixelSize : 500},
        ]
        setSheetSize(requests, sheetId, columnWidths, 500)

        // Per team (just one for now)
        shadeColumnsBlackInRow(requests, sheetId, 0, [0, 1, 12, 18, 29, 30])
        writeCell(requests, sheetId, 'Blue Side', 0, 0, {'red' : 1.0, 'green' : 1.0, 'blue' : 1.0}, 35, true, true, true)
        writeCell(requests, sheetId, 'Red Side', 0, 30, {'red' : 1.0, 'green' : 1.0, 'blue' : 1.0}, 35, true, true, true)
        writeCell(requests, sheetId, 'Game Time', 0, 7, {'red' : 0.0, 'green' : 0.0, 'blue' : 0.0}, 10, true)
        writeGameTime(requests, sheetId, statsJson.gameDuration, 0, 8)

        shadeColumnsBlackInRow(requests, sheetId, 1, [1, 12, 18, 29])
        writeFirstRowHeaders(requests, sheetId, 1, 2)

        for (var i = 0; i < 5; i++)
        {
            shadeColumnsBlackInRow(requests, sheetId, 2 + i, [1, 12, 18, 29])
            writeFirstRowBlueSide(requests, sheetId, 2 + i, 0, statsJson.participants[i], 0, 8)
            writeFirstRowRedSide(requests, sheetId, 2 + i, 19, statsJson.participants[i + 5], 0, 8)
        }

        shadeColumnsBlackInRow(requests, sheetId, 7, [1, 12, 18, 29])
        writeFirstRowHeadersTotal(requests, sheetId, 7, 2)

        shadeColumnsBlackInRow(requests, sheetId, 8, [1, 12, 18, 29])
        writeFirstRowTotal(requests, sheetId, 8, 2, 0, 8)

        shadeColumnsBlackInRow(requests, sheetId, 9, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30])

        shadeColumnsBlackInRow(requests, sheetId, 10, [1, 12, 18, 29])
        writeSecondRowHeaders(requests, sheetId, 10, 2)

        for (var i = 0; i < 5; i++)
        {
            shadeColumnsBlackInRow(requests, sheetId, 11 + i, [1, 12, 18, 29])
            writeSecondRowBlueSide(requests, sheetId, 11 + i, 0, statsJson.participants[i], 0, 8, 8)
            writeSecondRowRedSide(requests, sheetId, 11 + i, 19, statsJson.participants[i + 5], 0, 8, 8)
        }

        shadeColumnsBlackInRow(requests, sheetId, 16, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30])


        // Write objectives section
        shadeColumnsBlackInRow(requests, sheetId, 17, [1, 12, 18, 29])
        shadeColumnsBlackInRow(requests, sheetId, 18, [1, 12, 18, 29])
        shadeColumnsBlackInRow(requests, sheetId, 19, [1, 12, 18, 29])
        shadeColumnsBlackInRow(requests, sheetId, 20, [1, 12, 18, 29])
        shadeColumnsBlackInRow(requests, sheetId, 21, [1, 12, 18, 29])
        shadeColumnsBlackInRow(requests, sheetId, 22, [1, 12, 18, 29])
        shadeColumnsBlackInRow(requests, sheetId, 23, [1, 12, 18, 29])
        shadeColumnsBlackInRow(requests, sheetId, 24, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30])
        writeCell(requests, sheetId, 'Objectives', 17, 9, {'red' : 0.0, 'green' : 0.0, 'blue' : 0.0}, 10, true)
        writeCell(requests, sheetId, 'Objectives', 17, 21, {'red' : 0.0, 'green' : 0.0, 'blue' : 0.0}, 10, true)
        writeObjectives(requests, sheetId, 19, 7, statsJson.teams[0], 0, 8)
        writeObjectives(requests, sheetId, 19, 19, statsJson.teams[1], 0, 8)

        // Update middle section
        writeCell(requests, sheetId, 'Comparisons', 0, 15, {'red' : 0.0, 'green' : 0.0, 'blue' : 0.0}, 10, true)
        writeComparisons(requests, sheetId, 0)


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
