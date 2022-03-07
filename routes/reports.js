const express = require('express')
const router = express.Router()
let functions = require('../helpers/functions')

// Get All Data
router.get('/', async (req, res) => {
    try {
        const dataResponse = await functions.consolidateData(req.params.startDate, req.params.endDate, req.params.seller)
        res.json(dataResponse)
    } catch {
        res.status(500).json({ message: err.message })
    }
})

module.exports = router