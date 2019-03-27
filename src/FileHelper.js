const fs = require('fs')

module.exports = {
    /**
     * Append JSON to a file containing a list of JSON. If file does not exist, create the file.
     * If the id matches as an already entered JSON, then remove the previous one before appending
     * current value.
     * param[in] filename(string)  Name of the file
     * param[in] json(JSON)        JSON object to append to file
     * param[in] id(string)        Unique identifier. There can only be one unique ID per JSON
     *                             in the list at the top level.
     */
    appendJsonToListFile : function(filename, json, id='')
    {
        // If id is specified, make sure the json contains this identifier
        if (id != '' && json[id] == undefined)
        {
            throw 'Error: Id field \'' + id + '\' does not exist in json' 
        }

        let curJsonList = []
        if (fs.existsSync(filename))
        {
            curJsonList = _readJsonFromFile(filename)
            if (!Array.isArray(curJsonList))
            {
                throw 'Error: ' + filename + 'does not contain well-defined list.'
            }
        }

        // If id is specified, check if it already exists in the array
        if (id != '')
        {
            for (var i in curJsonList)
            {
                if (curJsonList[i][id] == undefined)
                {
                    throw 'Error: Id field \'' + id + '\' does not exist in element ' + i + ' in '
                                               + filename
                }

                if (curJsonList[i][id] == json[id])
                {
                    console.log('Warning: Json in ' + filename + ' with id ' + json[id] 
                                                    + ' already exists. Updating this value.')

                    curJsonList.splice(i, 1)
                }
            }
        }

        curJsonList.push(json)

        _writeJsonToFile(filename, curJsonList)
    },

    readJsonFromFile : function(filename)
    {
        return _readJsonFromFile(filename)
    },

    writeJsonToFile : function(filename, jsonToWrite)
    {
        _writeJsonToFile(filename, jsonToWrite)
    }
}

function _readJsonFromFile(filename)
{
    return JSON.parse(fs.readFileSync(filename))
}

function _writeJsonToFile(filename, json)
{
    fs.writeFileSync(filename, JSON.stringify(json, null, 2))
}