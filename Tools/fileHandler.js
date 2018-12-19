var parse = require('csv-parse');
var extend = require('node.extend');
var hDFSFileHandler = function(){
    return{
        fileElement:[
            "complianceProgress.log",
            "MLLIP.RECORD",
            "complianceVar",
            "RFA.SPOOL"
        ],
        readCSV: function(data, callback){
            parse(data, {columns: false, trim: true}, function(err, rows) {
                callback(rows);
            })
        },
        hdfsFileManager: function(source, param){
            var res = {
                "valid":[],
                "invalid":[]
            };
            try {
                if (!typeof(source) == "object") {
                    source = source.split('\n');
                }
                var preLength = source.length;
                source = source.filter((ele)=>{
                    if(hDFSFileHandler.lineFilter(ele, hDFSFileHandler.fileElement)){
                        return ele;
                    }
                })
                var midLength = source.length;
                source = source.map((ele)=>{
                    return hDFSFileHandler.lineSplit(ele, ' ');
                });

                source.map((ele, index)=>{
                    frag = hDFSFileHandler.fragHandler(ele, index, param);
                    if(Object.keys(frag.pass).length > 0)
                    {
                        res.valid.push(frag.pass);
                    }
                    else{
                        res.invalid.push(frag.invalid)
                    }
                });
                var afterLength = res.valid.length;
                console.log("filter from " + preLength  + " to " + midLength + " to " + afterLength);
                
            } catch (error) {
                console.log("hdfsFileManager: " + error.message)
            }
            return res;
        },

        lineSplit: function(line, spliter){
            var res = null;
            try {
                res = (typeof(line)=="object")?line[0].split(spliter):line.split(spliter);
            } catch (error) {
                console.log("lineSplit: " + error.message)
            }
            return res;
        },

        lineFilter: function(target, pattern){
            var res = null;
            target = (typeof(target)=="object")?target[0]:target;
            try {
                var value = 0;
                pattern.forEach(function(word){
                    value = value + target.includes(word);
                });
                return (value > 0)
            } catch (error) {
                console.log("lineFilter: " + error.message)
            }
            return res;
        },

        fragHandler: function(line, index, param){
            var resultLine = {
                "pass" : {},
                "invalid": {}
            };
            var indexPoint = 0;
            for(let numIndex = 4; numIndex < line.length; numIndex++){
                if(!isNaN(line[numIndex]) && line[numIndex]){
                    indexPoint = numIndex;
                    break;
                }
            }
            var recordFragment = line[indexPoint+3].split('/');
            var dateRegx = /^([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))$/g;
            var dateRegxForDetail = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
            var recordDetail = null;
            var recordDate = "";
            var hasDateFolder = false;
            if(dateRegx.test(recordFragment[3])){
                recordDetail = recordFragment[4];
                recordDate = recordFragment[3];
                hasDateFolder = true;
            }
            else{
                recordDetail = recordFragment[3];
                recordDate = (recordFragment[3].match(dateRegxForDetail) != null)?recordFragment[3].match(dateRegxForDetail)[0].replace('-','').replace('-',''):"";
            }
            var recordDetailPurify = hDFSFileHandler.removeLastElement(recordDetail, '.log', 1);
            var recordDetailFragement = recordDetailPurify.split('_');
            var recordCategory = recordDetailFragement[2].split('.')[0];
            var dataset = {
                "index": index,
                "size": parseInt(line[indexPoint]),//size
                "update_date": new Date(line[indexPoint + 1]),//update date
                "update_time": line[indexPoint + 2],//update time
                "filePath": line[indexPoint + 3],//filePath
                "fileDetail": recordDetailPurify,//fileDetail
                "category": recordCategory, //category.
                "date": "", //file date
                "filename": recordDetailFragement[2], //filename
                "engine": recordDetailFragement[1],//engine
                "warning": "", //warning hold place`
                "token": "", //token hold place,
                "merged_data_set": "", //hold place for merged data set
                "hasDateFolder": hasDateFolder
            }
            if(recordDetail != null && recordDate!= "" && dataset.update_date > param.from && dataset.update_date < param.to){
                dataset.date = hDFSFileHandler.dateConverter(recordDate);
                resultLine.pass = dataset;
            }
            else{
                resultLine.invalid = dataset;
            }
            return resultLine;
        },

        fileMerge: function(source){
            var res;
            //split to two array by hasDateFolder;
            var folderDataSet = source.filter((val,index,arr) => {
                return val.hasDateFolder == true;
            });
            var outsideDataSet = source.filter((val,index,arr) => {
                return val.hasDateFolder == false;
            });
            //filter with same filename + enginename 
            return res;
        },
        filterSame: function(source, paramSet){
            var bandList = [];
            source.filter(function(ele, index, array){
                array.forEach(function(e, i){
                    if((index < i) && (ele.engineName == e.engine) && (ele.filename == e.filename) && (!bandList.includes(e.index))){
                        bandList.push(e.index);
                        return true;
                    }
                    else{
                        return false;
                    }
                })
            });
        },
        // fileMerge: function(source){
        //     var res = [];
        //     var bandList = [];
        //     var size = 0;
        //     var mergedFile = [];
        //     source.forEach((ele, index, array)=>{
        //         size = 0;
        //         mergedFile = [];
        //         array.forEach((e, i)=>{
        //             if((index != i)&& //not current element
        //             (ele.filename == e.filename)&& //equal name
        //             (Math.abs(ele.date - e.date) < 86400001)&& //file date within 1 day
        //             //(ele[7] == e[7])&& //equal file date
        //             (ele.engine == e.engine)&& //equal engine name
        //             (ele.hasDateFolder == e.hasDateFolder)&& //both have date folder or not have
        //             (!bandList.includes(e.index)) &&  //not in band list
        //             (Math.abs(ele.update_date - e.update_date) < 259200000)) //update date within 3 day
        //             {
        //                 size += e.size;
        //                 bandList.push(e.index);
        //                 mergedFile.push(e)
        //             }
        //         })
        //         if(bandList.indexOf(ele.index) == -1)
        //         {
        //             mergedFile.push(ele);
        //             size += ele.size;
        //             bandList.push(ele.index);
        //             // var newEle = $.extend(true, [], ele);
        //             var newEle = extend(true, {}, ele);
        //             newEle.size = size;
        //             newEle.merged_data_set = mergedFile;
        //             res.push(newEle);
        //         }
        //     })
        //     return res;
        // },

        fileCheck: function(source){
            var res = null;
            try {
                if (source) {
                    var bandList = new Set();
                    source.map((ele, index , array)=>{
                        array.forEach((e, i)=>{
                            var token = hDFSFileHandler.generateToken();
                            if((ele[1] == e[1]) && //same size
                            (ele[1] > 500) &&
                            (ele[8] == e[8]) && //same detail name
                            (index != i)&& //not same element
                            (ele[9] == e[9]) &&  //same engine
                            (!ele[4].includes("Agile")) && //not check Agile 
                            (!ele[4].includes("app")) &&//not check app
                            (!bandList.has(ele[0]))
                            ){
                                ele[10] = "Duplicate";
                                ele[11] = (ele[11])?ele[11]:token;
                                e[10] = "Duplicate"
                                e[11] = ele[11]
                                bandList.add(e[0]);
                            }else if(
                            (ele[8] == e[8]) && //same detail name
                            (index != i)&& //not same element
                            (ele[9] == e[9]) &&  //same engine
                            (!ele[4].includes("Agile")) && //not check Agile 
                            (!ele[4].includes("app")) &&//not check app
                            (!bandList.has(ele[0]))
                            ){
                                
                                ele[10] = (ele[10] == "Duplicate") ? ele[10] + "/Warning": "Warning";
                                ele[11] = (ele[11]) ? ele[11] : token;
                                e[10] = ele[10];
                                e[11] = ele[11];
                                bandList.add(e[0]);
                            }
                        })
                        bandList.add(ele[0]);
                    })
                    return source;
                }
            } catch (error) {
                console.log(error);
            }
            return res;
        },

        removeLastElement: function(elem, spliter, count){
            count = count?count:1;
            var res = "";
            try {
                var repo = elem.split(spliter);
                if (repo.length > 1) {
                    for (let index = 0; index < repo.length - count; index++) {
                        res += (index == repo.length - (count))? repo[index]:repo[index] + spliter;
                    }
                }
                else{
                    res = elem;
                }
            } catch (error) {
                console.log(error);
            }
            return res;
        },

        //from yyyyMMdd to yyyy-MM-dd
        dateConverter: function(date){
            var res = null;
            if (date) {
                var year = date.substring(0, 4);
                var month = date.substring(4, 6);
                var day = date.substring(6, 8);

                res = year + '-' + month + '-' + day;
            }
            return res;
        },

        generateToken: function(){
            var rand = function() {
                return Math.random().toString(36).substr(2); // remove `0.`
            };
            return rand() + rand();
            
        }
    }
}();

var cibFileHandler = function(){
    return{
        fileElement:[
            "complianceProgress.log",
            "MLLIP.RECORD",
            "complianceVar",
            "RFA.SPOOL"
        ],
        cibFileManager: function(source, engineName){
            var res = null;
            try {
                if (!typeof(source) == "object") {
                    source = source.split('\n');
                }
                var preLength = source.length;
                source = source.filter((ele)=>{
                    if(hDFSFileHandler.lineFilter(ele, hDFSFileHandler.fileElement)){
                        return ele;
                    }
                });
                var afterLength = source.length;
                console.log("filter from " + preLength + " to " + afterLength);
                
                res = source.map((ele, i)=>{
                    var handleDate = cibFileHandler.dateConverter(ele[1]);
                    ele[1] = ele[2]; // size
                    ele[2] = handleDate[0]; //update date
                    ele[3] = handleDate[1]; //update time
                    ele[4] = cibFileHandler.getFileDate(ele[0]); //file date
                    ele[5] = ele[0]; //name
                    ele[0] = i; //index
                    ele[6] = engineName; //engine
                    ele[7] = []; //holdplace for compare
                    
                    return ele;
                }); 
            } catch (error) {
                console.log("cibFileManager: " + error.message)
            }
            return res;
        },
        //from dd/MM/yyyy to yyyy-MM-dd
        dateConverter: function(date){
            var res = [2];
            if (date) {
                var dateList = date.split(' ')[1].split('/');
                var year = dateList[2];
                var month = dateList[1];
                var day = dateList[0];

                res[0] = year + '-' + month + '-' + day;
                res[1] = date.split(' ')[2];
            }
            return res;
        },
        getFileDate: function(fileName){
            return fileName.split('.')[1];
        },
        compareData: function (cibData, hdfsData) {
            var res = [];
            try {
                if (cibData.length > 1 && hdfsData.length > 1) {
                    cibData.forEach((cibEle)=>{
                        hdfsData.forEach((hdfsEle)=>{
                            if( (hdfsEle[8] == cibEle[5]) //Name
                                // &&(hdfsEle[7] == cibEle[4])//Date
                                &&(hdfsEle[9].toLowerCase() == cibEle[6].toLowerCase())//Engine
                            ){
                                cibEle[7].push(hdfsEle);
                            }
                        })
                    })
                }
                
            } catch (error) {
                console.log(error);
            }
            return res;
        }
    }
}();

module.exports = hDFSFileHandler;