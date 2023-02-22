var express = require('express');
var router = express.Router();
const csvWriter = require('csv-write-stream');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
var random_name = require('node-random-name');
var mysql = require('mysql');
var csv = require('csv-parse');

/* Don't forget to change your credentials for mySQL! */

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "test",
    port: 8889
});


/* GET return success in a object. */

router.get('/test', function(req, res, next) {
  res.json({ success: true });
});

/* GET Generate a CSV file with 1 milion lines */

router.get('/csv', function(req, res, next) {
  const data = [];
  for (let i = 0; i < 1000000; i++) {
    data.push({
      uuid: uuidv4(),
      nom: random_name({ random: Math.random}),
      email: 'test' + (i + 1) + '@gmail.com'
    });
  }
  const writer = csvWriter();
  writer.pipe(fs.createWriteStream('utilisateurs.csv'));
  data.forEach((row) => writer.write(row));
  writer.end();
  res.end('CSV file generated successfully!');
});

/* GET create a new table into existing table.  */

router.get('/create-table', function(req, res, next) {

  con.connect(function(err) {
    if (err) throw err;
    var sql = "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(255), nom VARCHAR(64), email VARCHAR(64))";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send('Table created!')
    });
  });
});

/* GET Import data from CSV to Mysql users table */

router.get('/import-csv', function(req, res, next) {
  var data = [];
  fs.createReadStream('./utilisateurs.csv')
      .pipe(csv.parse({ headers: true }))
      .on('error', error => console.error(error))
      .on('data', row => data.push(row))
      .on('end', () => {
        con.connect(async function (err) {
          if (err) throw err;
          console.log("Connected!");
          var sql = "INSERT INTO users (uuid, nom, email) VALUES ?";
          data.shift()
          await con.query(sql, [data], function (err, result) {
            if (err) {
              console.log(err);
            } else {
              res.send("Number of records inserted: " + result.affectedRows);
            }
          });
        });
      });
});

module.exports = router;
