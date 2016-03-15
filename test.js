var express   =    require("express");
var mysql     =    require('mysql');
var app       =    express();

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host     : 'localhost',
    user     : 'choxx',
    password : 'letsgetstart@###',
    database : 'gps',
    debug    :  false
});

function handle_database() {
    
    pool.getConnection(function(err,conn){
        if (err) {
          conn.release();
          //res.json({"code" : 100, "status" : "Error in conn database"});
          return;
        }   

        console.log('connected as id ' + conn.threadId);
        
        conn.query("select * from user",function(err,rowsss){
            conn.release();
            if(!err) {
                console.log(rowsss);
            }           
        });

        conn.on('error', function(err) {      
              //res.json({"code" : 100, "status" : "Error in conn database"});
              return;     
        });
  });
}


        handle_database();
        //console.log();
