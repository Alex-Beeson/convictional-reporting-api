const express = require('express')
const router = express.Router()
let functions = require('../helpers/functions')

// Get All Data
router.get('/', async (req, res) => {
    try {
        const dataResponse = await functions.consolidateData(req.query.startDate, req.query.endDate, req.query.seller)
        console.log('Successful Request')
        res.status(200).json(dataResponse)
    } catch(err) {
        res.status(500).json({ message: err.message})
    }
})

module.exports = router