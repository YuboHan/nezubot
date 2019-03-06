class Player {
    // Empty constructor
    constructor() {
        this.id = "null"
        this.summonerName = "null"
        this.opGG = "null"
        Object.seal(this)
    }

    populate(summonerName) {
        this.id = summonerName.toLowerCase().replace(/\s+/g, '')
        this.summonerName = summonerName.trim() // Remove leading and trailing whitespace
        this.opGG = "https://na.op.gg/summoner/userName=" + this.id
    }

    fromJson(json) {
        Object.keys(json).forEach(key => {
            switch(key) {
                case "id":
                case "summonerName":
                case "opGG":
                    this[key] = json[key]
                    break
                default:
                    throw "Error: Cannot convert to json. Unrecognized key \"" + key + "\""
                    break
            }
        })
    }
}

class Roster {
    constructor() {
        this.top = new Player()
        this.jungle = new Player()
        this.mid = new Player()
        this.adc = new Player()
        this.support = new Player()
        this.subs = []
        Object.seal(this)
    }

    addPlayer(role, name) {
        var formattedRole = role.toLowerCase().trim()
        var formattedName = name.trim()

        switch(formattedRole) {
            case "top":
                if (this.top.id != "null") {
                    throw "Error: Multiple instances of top: " + this.top.summonerName + " and " + formattedName
                }
                this.top.populate(formattedName)
                break
            case "jungle":
            case "jg":
            case "jung":
                if (this.jungle.id != "null") {
                    throw "Error: Multiple instances of jungle: " + this.jungle.summonerName + " and " + formattedName
                }
                this.jungle.populate(formattedName)
                break
            case "mid":
            case "middle":
                if (this.mid.id != "null") {
                    throw "Error: Multiple instances of mid: " + this.mid.summonerName + " and " + formattedName
                }
                this.mid.populate(formattedName)
                break
            case "adc":
            case "bot":
                if (this.adc.id != "null") {
                    throw "Error: Multiple instances of adc: " + this.adc.summonerName + " and " + formattedName
                }
                this.adc.populate(formattedName)
                break
            case "support":
            case "sup":
            case "supp":
                if (this.support.id != "null") {
                    throw "Error: Multiple instances of support: " + this.support.summonerName + " and " + formattedName
                }
                this.support.populate(formattedName)
                break
            case "sub":
            case "substitute":
            case 'subs':
                var p = new Player()
                p.populate(formattedName)
                this.subs.push(p)
                break
            default:
                throw "Error: Unrecognized role \"" + role + "\""
                break
        }
    }

    fromJson(json) {
        Object.keys(json).forEach(key => {
            switch(key) {
                case "top":
                case "jungle":
                case "mid":
                case "adc":
                case "support":
                    var p = new Player()
                    p.fromJson(json[key])
                    this[key] = p
                    break
                case "subs":
                    var pList = []

                    for (var i in json[key]) {
                        var p = new Player()
                        p.fromJson(json[key][i])
                        pList.push(p)
                    }
                    this[key] = pList
                    break
                default:
                    throw "Error: Cannot convert from Json. Unrecognized key \"" + key + "\""
                    break
            }
        })
    }
}

class Team {
    constructor() {
        this.teamId = "null"
        this.teamName = "null"
        this.roster = new Roster()
        this.teamOpGG = "null"
        Object.seal(this)
    }

    populate(teamName, roster) {
        this.teamId = teamName.toLowerCase().replace(/\s+/g, '')
        this.teamName = teamName.trim() // Remove leading and trailing whitespace
        this.roster = roster
        this.teamOpGG = this.getTeamOpGG()

    }

    getTeamOpGG() {
        var ret = "https://na.op.gg/multi/query="

        var firstVal = true
        Object.keys(this.roster).forEach(key => {
            if (key == "subs") {
                for (var i in this.roster["subs"]) {
                    if (firstVal) {
                        firstVal = false
                    }
                    else {
                        ret += "%2C"
                    }

                    ret += this.roster[key][i].id
                }
            }
            else {
                if (this.roster[key].id != "null") {
                    if (firstVal) {
                        firstVal = false
                    }
                    else {
                        ret += "%2C"
                    }

                    ret += this.roster[key].id
                }
            }
        })

        return ret
    }

    fromJson(json) {
        Object.keys(json).forEach(key => {
            switch(key) {
                case "teamId":
                case "teamName":
                case "teamOpGG":
                    this[key] = json[key]
                    break
                case "roster":
                    var r = new Roster()
                    r.fromJson(json[key])
                    this[key] = r
                    break
                default:
                    throw "Error: Cannot convert from Json. Unrecognized key \"" + key + "\""
                    break
            }
        })
    }
}

module.exports = {
    Player, Roster, Team
}