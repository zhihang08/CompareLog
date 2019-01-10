var parse = require('csv-parse');
var extend = require('node.extend');
var hDFSFileHandler = function(){
    return{
        //acceptable log type
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
                "fileName": recordDetailFragement[2], //filename
                "engine": recordDetailFragement[1],//engine
                "warning": "", //warning hold place`
                "token": "", //token hold place,
                "merged_data_set": [], //hold place for merged data set
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
            var size = 0;
            var mergedFile = [];
            source.forEach((ele, index, array)=>{
                if (ele == null) {
                    return;
                }
                size = ele.size;
                mergedFile = [];
                for (let i = index + 1, len = array.length - index - 1; i < len; i++) {
                    if(array[i] == null) continue;
                    var e = array[i];
                    if((index != i)&& 
                        (ele.fileName == e.fileName) && 
                        (ele.engine == e.engine)&& 
                        (ele.hasDateFolder == e.hasDateFolder)&&
                        (Math.abs(Date.parse(ele.date) - Date.parse(e.date)) < 86400001) &&
                        (Math.abs(ele.update_date - e.update_date) < 259200000)
                        ){
                        //merge 
                        size += e.size;
                        var duplicateElement = extend(true, {}, e);
                        mergedFile.push(duplicateElement);
                        array.splice(i, 1);
                        i--;
                    }
                }
                ele.size = size;
                ele.merged_data_set = mergedFile;
            })
            return source;
        },

        fileIteratorMerge: function(source){
            var merge = function(index, targetArray){
                // console.log("Merging " + index);
                // console.log("current target: " + JSON.stringify(targetArray));
                var compareTarget = targetArray[index];
                for (let i = 0; i < targetArray.length; i++) {
                    try {
                        if(
                        (index != i) &&
                        (compareTarget.fileName == targetArray[i].fileName) && 
                        (compareTarget.engine == targetArray[i].engine)&& 
                        (compareTarget.hasDateFolder == targetArray[i].hasDateFolder)&&
                        (Math.abs(Date.parse(compareTarget.date) - Date.parse(targetArray[i].date)) < 86400001) &&
                        (Math.abs(compareTarget.update_date - targetArray[i].update_date) < 259200000)
                        ){
                            compareTarget.size += targetArray[i].size;
                            var duplicateElement = extend(true, {}, targetArray[i]);
                            compareTarget.merged_data_set.push(duplicateElement);
                            targetArray.splice(i, 1);
                            i--;
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
                if(index < targetArray.length - 1){
                    index++;
                    merge(index, targetArray);
                }
                else{
                    return;
                }
            }
            merge(0,  source);
            return source;
        },

        fileCheck: function(source){
            var res = null;
            try {
                if (source) {
                    source.map((ele, index , array)=>{
                        array.forEach((e, i)=>{
                            var token = hDFSFileHandler.generateToken();
                            if((ele.size == e.size) && //same size
                            (ele.size > 500) &&
                            (ele.fileName == e.fileName) && //same detail name
                            (index != i)&& //not same element
                            (ele.engine == e.engine)  //same engine
                            ){
                                ele.warning = "Duplicate";
                                ele.token = (ele.token)?ele.token:token;
                                e.warning = "Duplicate";
                                e.token = ele.token;
                            }else if(
                            (ele.fileName == e.fileName) && //same detail name
                            (index != i)&& //not same element
                            (ele.engine == e.engine)  //same engine
                            ){
                                
                                ele.warning = (ele.warning == "Duplicate") ? ele.warning + "/Warning": "Warning";
                                ele.token = (ele.token) ? ele.token : token;
                                e.warning = ele.warning;
                                e.token = ele.token;
                            }
                        })
                    })
                    return source;
                }
            } catch (error) {
                console.log(error);
            }
            return res;
        },

        fileIteratorCheck: function(source){
            var res = null;
            try {
                if (source) {
                    var checkWarn = function(index, array){
                        compareTarget = array[index];
                        var token = hDFSFileHandler.generateToken();
                        for (let i = 0; i < array.length; i++) {
                            try {
                                if((compareTarget.size == array[i].size) && //same size
                                (compareTarget.size > 500) &&
                                (compareTarget.fileName == array[i].fileName) && //same detail name
                                (index != i)&& //not same element
                                (compareTarget.engine == array[i].engine)  //same engine
                                ){
                                    compareTarget.warning = array[i].warning = "Duplicate";
                                    compareTarget.token = (compareTarget.token)?compareTarget.token:token;
                                    array[i].token = compareTarget.token;
                                    array.splice(i, 1);
                                    i--;
                                }else if(
                                (compareTarget.fileName == array[i].fileName) && //same detail name
                                (index != i)&& //not same element
                                (compareTarget.engine ==array[i].engine)  //same engine
                                ){
                                    
                                    compareTarget.warning = (compareTarget.warning == "Duplicate") ? compareTarget.warning + "/Warning": "Warning";
                                    compareTarget.token = (compareTarget.token) ? compareTarget.token : token;
                                    array[i].warning = compareTarget.warning;
                                    array[i].token = compareTarget.token;
                                }
                            } catch (error) {
                                console.log(error);
                            }
                        }
                        if(index < array.length - 1){
                            index++;
                            checkWarn(index, array);
                        }
                        else{
                            return;
                        }
                    }
                    checkWarn(0, source);
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

//current not in use
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