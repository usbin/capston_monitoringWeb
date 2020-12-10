var mysql = require('mysql');
var config = require(__dirname+'/databaseInfo.js').local;

module.exports.init = function() {
    return mysql.createConnection({
        host : config.host,
        port : config.port,
        user : config.user,
        password : config.password,
        database : config.database
    })
};
module.exports.open = function (con,callback){
    con.connect(function (err){
        if(err){
            console.err('mysql connection error : '+err);
        } else{
            console.info('mysql is connected successfully.');
            callback();
        }
    })
};

// var connection = mysql.createConnection({
//     host        :   'localhost',
//     user        :   'root',
//     password    :   '12551255',
//     database    :   'monitoring'
// });

// connection.connect();
// connection.query('SELECT 1+1 AS solution', function(err, rows, fields) {
//     if (err) throw err;

//     console.log('The solution is : ', rows[0].solution);
// })
// connection.end();
