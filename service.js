const express = require('express')
const path = require('path')
const app = express()
const fs = require('fs');
const request = require('request');
const formidable = require('formidable');
const execFile = require('child_process').execFile;
const exec = require('child_process').exec;

var fileHandler = require('./Tools/merge-and-compare.js');

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/client')));
app.use(express.static(path.join(__dirname, '/client/js')));
app.use(express.static(path.join(__dirname, '/client/css')));

app.param('fileName', function (req, res, next, fileName) {
    req.fileName = fileName;
    return next();
  });
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'client')))

app.get('/', function (req, res) {
    res.sendfile("index.html");
})

//fileHandler API
app.post('/uploadFile', (req, res)=>{
    var body = "";
    req.on("data", function (chunk) {
        body += chunk;
    });

    req.on("end", function(){
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(body);
    });
    // var form = new formidable.IncomingForm();
    // form.parse(req, function (err, fields, file) {
    //   if(err){
    //     res.status(400).send(err);
    //   }
    //   else if(file.files){
    //     res.status(200).send(file.files.path);
    //   }
    //   else{
    //     res.status(500).send("unknown");
    //   }
    // });
});

app.get('/fileCompare', (req, res)=>{
    // if(!main.winData || !main.linuxData){
    //     res.send("no data in cache").status(400);
    //     main.getAllFile();
    // }
    // else{
    //     main.compare(main.dataHandler(main.winData), main.dataHandler(main.linuxData));
    // }
    main.linuxDataHandler(main.linuxData);
});

app.get('/fileMerge', (req, res)=>{
    // if(!main.winData || !main.linuxData){
    //     res.send("no data in cache").status(400);
    //     main.getAllFile();
    // }
    // else{
    //     main.compare(main.dataHandler(main.winData), main.dataHandler(main.linuxData));
    // }
    main.linuxDataHandler(main.linuxData);
});

app.get('/generateResult', (req, res)=>{
    var fileName = req.query.fileName;
    main.getAllFile(fileName, function(data){
        res.send(data);
    });
});

var main = function(){
    return{
        generateResult: function(data, callback){
            if(fs.existsSync(filePath)){
                  fs.readFile(filePath, "utf8", function (err, data) {
                    if (err) {
                        callback(err);
                    }
                    callback({
                      "code":"Done",
                      "data": data,
                      "mtime": fs.statSync(filePath).mtime
                    });
                  });
                }
                else{
                    callback("cannot find file " + filePath);
                }
        },
        fileCompare: function(data, callback){
            // request('http://10.117.62.146:3005/winfile/scand_data_10-09-2018.csv', function (error, response, body) {
            //     if (!error && response.statusCode == 200) {
            //       var info = JSON.parse(body);
            //       main.winData = info.data;
            //       console.log(info);
            //     }
            // });
            // request('http://10.206.156.198:3005/liuxfile/' + fileName, function (error, response, body) {
            //     if (!error && response.statusCode == 200) {
            //       var info = JSON.parse(body);
            //     //   main.linuxData = info.data;
            //     //   console.log(info);
            //       main.linuxDataHandler(info.data, callback);
            //     }
            //     else{
            //         console.log(error, response);
            //     }
            // })
            main.getFile('D:\\Logs\\log_compare\\HDFSLogFileInfoQA_2018090920.csv', function(data){
                callback(data);
                //main.linuxDataHandler(data.data, callback);
            });
        },
        fileMerge: function(data, callback){
           
        }
    }
}();

app.listen(3005, () => console.log('Example app listening on port 3005!'))