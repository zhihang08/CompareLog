const express = require('express')
const path = require('path')
const app = express()
const fs = require('fs');
const request = require('request');
const formidable = require('formidable');
const execFile = require('child_process').execFile;
const exec = require('child_process').exec;
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
const repo = "LogRepo";

var hDFSFileHandler = require('./Tools/fileHandler.js');

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
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, file) {
      if(err){
        res.status(400).send(err);
      }
      else if(file.files){
        var dateparam = JSON.parse(fields.param);
        dateparam.from = new Date(dateparam.from);
        dateparam.to = new Date(dateparam.to);
        fs.readFile(file.files.path, function(error, data){
            if(error){
                throw error;
            }
            hDFSFileHandler.readCSV(data, function(data){
                var result = hDFSFileHandler.hdfsFileManager(data, dateparam);
                main.refreshData("LogsCollection", result.valid);
            });
        })
        res.status(200).send(file.files.path);
      }
      else{
        res.status(500).send("unknown");
      }
    });
});

app.get('/mergeDuplicateRecord', (req, res)=>{
    try {
        main.fileMerge();
        res.status(200).send("done");
    } catch (error) {
        res.status(500).send("unknown");
    }
});

app.get('/checkWarning', (req, res)=>{
    try {
        main.checkWarning();
        res.status(200).send("done");
    } catch (error) {
        res.status(500).send("unknown");
    }
});

app.get('/getMergeResult', (req, res)=>{
    main.findAll("LogsCollection_merged", function(data){
        res.send(data);
    });
});

var main = function(){
    return{
        queryData: function (target, query) {
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(repo);
                dbo.collection(target).find(query).toArray(function(err, result) {
                  if (err) throw err;
                  console.log(result);
                  db.close();
                   res = result;
                });
              });
              return res;
        },
        refreshData: function(target, data){
            try {
                if (data && data.length > 0) {
                    var length = data.length;
                    MongoClient.connect(url, function(err, db) {
                        if (err) throw err;
                        var dbo = db.db(repo);
                        dbo.collection(target).remove().then(function () {
                            dbo.collection(target).insertMany(data, function(err, res) {
                                if (err) throw err;
                                console.log(target + " collection " + length + " data inserted");
                                db.close();
                            });
                        })
                    });
                }
            } catch (error) {
                console.log(error);
            }
        },
        insertData: function(target, data){
            try {
                if (data.length > 0) {
                    var length = data.length;
                    MongoClient.connect(url, function(err, db) {
                        if (err) throw err;
                        var dbo = db.db(repo);
                        dbo.collection(target).insertMany(data, function(err, res) {
                            if (err) throw err;
                            console.log(target + " collection " + length + " data inserted");
                            db.close();
                        });
                    });
                }
            } catch (error) {
                console.log(error);
            }
        },
        deleteCollection: function(target){
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(repo);
                dbo.collection(target).drop(function(err, delOK) {
                  if (err) throw err;
                  if (delOK) console.log("Collection deleted");
                  db.close();
                });
              });
        },
        sort: function (target, mysort) {
            var result = null;
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(repo);
                //var mysort = { name: 1 };
                dbo.collection(target).find().sort(mysort).toArray(function(err, res) {
                  if (err) throw err;
                  result = res;
                  db.close();
                });
              });
            return result;
        },
        findAll: function(target, callback){
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(repo);
                dbo.collection(target).find({}).toArray(function(err, res) {
                  if (err) throw err;
                  db.close();
                  callback(res)
                });
              });
        },
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
        fileMerge: function(callback){
            try {
                main.findAll("LogsCollection", function(data){
                    var result = hDFSFileHandler.fileIteratorMerge(data);
                    main.refreshData("LogsCollection_merged", result);
                });
            } catch (error) {
                console.log(error);
            }
        },
        checkWarning: function(callback){
            try {
                main.findAll("LogsCollection_merged", function(data){
                    var result = hDFSFileHandler.fileIteratorCheck(data);
                    main.refreshData("LogsCollection_merged", result);
                });
            } catch (error) {
                console.log(error);
            }
        }
    }
}();

app.listen(3005, () => console.log('Example app listening on port 3005!'))