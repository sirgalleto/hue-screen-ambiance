const lowdb = require('lowdb');

const db = lowdb('./db.json');

db.defaults({ username: '' }).write();

module.exports = db;