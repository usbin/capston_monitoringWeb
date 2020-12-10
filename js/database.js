const databaseCon = require(__dirname+'/databaseCon.js');

module.exports.connect = function(){
    //db 설정
    var connection = databaseCon.init();
    databaseCon.open(connection, function(){
        //커넥션 후에 실행
        connection.query(
            `SELECT * FROM user`
            // ```SELECT 1 FROM Information_schema.tables
            // WHERE table_schema = 'monitoring'
            // AND table_name = 'user';
            // ```
        , function(error, results, fields){
            if(error){
                console.error("Database checking error.");
            }
            else{
                if(results.length != 0){
                    console.log("user(0x0000, test) exists in DB.");
                }
            }
        })
        return connection;
    });
    
};

module.exports.disconnect = function(connection){
    connection.end();
}

module.exports.writeYawnTime = function(connection, date){
    
    connection.query('INSERT INTO yawn VALUES '+date.prototype.toMysqlFormat);
}

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}
Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};