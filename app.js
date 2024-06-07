const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB server: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//Returns a list of all the players in the player table
app.get('/players/', async (request, response) => {
  const getPlayerQuery = `SELECT * FROM player_details`
  const getPlayerArray = await db.all(getPlayerQuery)
  const ans = dbObj => {
    return {
      playerId: dbObj.player_id,
      playerName: dbObj.player_name,
    }
  }
  response.send(getPlayerArray.map(players => ans(players)))
})

//Returns a specific player based on the player ID
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQueryId = `SELECT * FROM player_details WHERE player_id=${playerId}`
  const getPlayerArrayId = await db.get(getPlayerQueryId)
  const ans = dbObj => {
    return {
      playerId: dbObj.player_id,
      playerName: dbObj.player_name,
    }
  }
  response.send(ans(getPlayerArrayId))
})

//Updates the details of a specific player based on the player ID
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerId = request.body
  const {playerName} = getPlayerId
  const updatePlayer = `
  UPDATE 
    player_details 
  SET 
    player_name='${playerName}'
  WHERE 
    player_id=${playerId}`
  await db.run(updatePlayer)
  response.send('Player Details Updated')
})

//Returns the match details of a specific match
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQueryId = `SELECT * FROM match_details WHERE match_id=${matchId}`
  const getMatchArrayId = await db.get(getMatchQueryId)
  const ans = dbObj => {
    return {
      matchId: dbObj.match_id,
      match: dbObj.match,
      year: dbObj.year,
    }
  }
  response.send(ans(getMatchArrayId))
})

//Returns a list of all the matches of a player
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchQueryId = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id=${playerId}`
  const getMatchArrayId = await db.all(getMatchQueryId)
  const ans = dbObj => {
    return {
      matchId: dbObj.match_id,
      match: dbObj.match,
      year: dbObj.year,
    }
  }
  response.send(getMatchArrayId.map(match => ans(match)))
})

//Returns a list of players of a specific match
app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQueryId = `SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id=${matchId}`
  const getMatchArrayId = await db.all(getMatchQueryId)
  const ans = dbObj => {
    return {
      playerId: dbObj.player_id,
      playerName: dbObj.player_name,
    }
  }
  response.send(getMatchArrayId.map(match => ans(match)))
})

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getmatchPlayerQuery = `
    select 
      player_id as playerId,
      player_name as playerName,
      sum(score) as totalScore,
      sum(fours) as totalFours,
      sum(sixes) as totalSixes
    from 
      player_match_score natural join player_details
    where
      player_id=${playerId}`
  const getMatchPlayerArray = await db.get(getmatchPlayerQuery)
  response.send(getMatchPlayerArray)
})

module.exports = app
