const mongoose = require('mongoose')
const {mongoUri} = require('../config')

async function setUp() {
	await mongoose.connect(mongoUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	})
	console.log('Successfully connected to database.')
}

module.exports = setUp
