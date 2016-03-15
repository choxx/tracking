var gps = require("gps-tracking");
//var express   =    require("express");
var mysql     =    require('mysql');

var connCheckDeviceId = mysql.createConnection({
    host     : 'localhost',
    user     : 'choxx',
    password : 'letsgetstart@###',
    database : 'gps1',
});

var pool      =    mysql.createPool({
    connectionLimit : 1000, //important
    host     : 'localhost',
    user     : 'choxx',
    password : 'letsgetstart@###',
    database : 'gps1',
    debug    :  false
});

var options = {
    'debug'                 : true,
    'port'                  : 8787,
    'device_adapter'        : "TK103"
}
var insertLogingTime = 'INSERT INTO tk103_devices_login SET ?';
var loginTime, gpsData;
var insertDataAfterLogin = 'INSERT INTO tk103_devices_data SET ?';
var loginData;
var server = gps.server(options,function(device,connection){

    device.on("login_request",function(device_id,msg_parts){
        console.log("1");
        var this_req = this;
        // Some devices sends a login request before transmitting their position
        // Do some stuff before authenticate the device... 

        // Accept the login request. You can set false to reject the device.
            connCheckDeviceId.query('SELECT * FROM tk103_devices WHERE device_id = ?',device_id, function(err, rows){
                if(err){
                    connCheckDeviceId.release();
                    //throw err;
                    return;
                }
                //console.log(rows);
                if(rows.length == 1){
                    loginTime = new Date();
                    this_req.login_authorized(true); 
                    loginData = {device_id: device_id, loggedin_at: loginTime};

                    pool.getConnection(function(err,conn){
                        if (err) {
                          conn.release();
                          return;
                        }   

                        //console.log('connected as id ' + conn.threadId);
                        conn.query(insertLogingTime,loginData,function(err,info){
                            //conn.release();
                            if(err) 
                                conn.release();
                            if(!err) {
                                console.log('saved login time'+info.insertId);
                                //console.log(rowsss);
                                conn.release();
                            }           
                        });
                        //console.log(query.info);
                        conn.on('error', function(err) {      
                              //res.json({"code" : 100, "status" : "Error in conn database"});
                              console.log(err);
                              conn.release();
                              return;     
                        });
                    });

                //inserting into tk103_current_location if device_id not exists
                pool.getConnection(function(err,connInsertIntoTk103CurrentLocation){
                    if (err) {
                      connInsertIntoTk103CurrentLocation.release();
                      //res.json({"code" : 100, "status" : "Error in conn database"});
                      return;
                    }  
                    connInsertIntoTk103CurrentLocation.query('INSERT IGNORE INTO tk103_current_location SET ?',{device_id: device_id},function(err,info){
                        //conn.release();
                        if(err) 
                            connInsertIntoTk103CurrentLocation.release();
                        if(!err) {
                            console.log('saved into db'+info.insertId);
                            connInsertIntoTk103CurrentLocation.release();
                        }           
                    });            
                    //console.log(query.info);
                    connInsertIntoTk103CurrentLocation.on('error', function(err) {      
                          //res.json({"code" : 100, "status" : "Error in conn database"});
                          console.log(err);
                          connInsertIntoTk103CurrentLocation.release();
                          return;     
                    });
                });                    
                }else{
                    this_req.login_authorized(false);
                }
            });

            return this_req;

    });


    //PING -> When the gps sends their position  
    device.on("ping",function(data){

        //After the ping is received, but before the data is saved
        console.log(data);
        gpsData = {
                        device_id: data.device_id,
                        inserted_at: data.inserted, 
                        cmd: data.from_cmd, 
                        date: data.date,
                        latitude: data.latitude, 
                        longitude: data.longitude, 
                        address: 'address', 
                        speed: data.speed,
                        time: data.time, 
                        orientation: data.orientation, 
                        power: 'power', 
                        ignition: 'ignition',
                        mileage: data.mile_data, 
                        ac: 'ac', 
                        last: 'last'
                    };      
        pool.getConnection(function(err,conn){
            if (err) {
              conn.release();
              //res.json({"code" : 100, "status" : "Error in conn database"});
              return;
            }   

            console.log('connected as id ' + conn.threadId);

            conn.query(insertDataAfterLogin,gpsData,function(err,info){
                //conn.release();
                if(err) 
                    conn.release();
                if(!err) {
                    console.log('saved into db'+info.insertId);
                    conn.release();
                }           
            });            
            //console.log(query.info);
            conn.on('error', function(err) {      
                  //res.json({"code" : 100, "status" : "Error in conn database"});
                  console.log(err);
                  conn.release();
                  return;     
            });
        });  
        pool.getConnection(function(err,conn){
            if (err) {
              conn.release();
              //res.json({"code" : 100, "status" : "Error in conn database"});
              return;
            }   

            console.log('connected as id ' + conn.threadId);

            conn.query('UPDATE tk103_current_location SET dated = ?, speed = ?, latitude = ?, longitude =? WHERE device_id = ?',[new Date(), data.speed, data.latitude, data.longitude, data.device_id],function(err,infoCurrentLocation){
                //conn.release();
                if(err) 
                    conn.release();
                if(!err) {
                    console.log('saved current location'+infoCurrentLocation.insertId);
                    //console.log(rowsss);
                    conn.release();
                }           
            });            
            //console.log(query.info);
            conn.on('error', function(err) {      
                  //res.json({"code" : 100, "status" : "Error in conn database"});
                  console.log(err);
                  conn.release();
                  return;     
            });
        });        
        return data;

    });

   device.on("alarm",function(alarm_code,alarm_data,msg_data){
        console.log(alarm_code);
        console.log(alarm_data);
        console.log(msg_data);
        console.log("Help! Something happend: "+alarm_code+" ("+alarm_data.msg+")");
    }); 

    //Also, you can listen on the native connection object
    connection.on('data',function(data){
        //echo raw data package
        console.log(data.toString()); 
    });    

});


