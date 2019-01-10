var hDFSFileHandler = function(){
    return{
        fileElement:[
            "complianceProgress.log",
            "MLLIP.RECORD",
            "complianceVar",
            "RFA.SPOOL"
        ],
        hdfsFileManager: function(source){
            var res = [];
            try {
                if (!typeof(source) == "object") {
                    source = source.split('\n');
                }
                source = source.filter((ele)=>{
                    if(hDFSFileHandler.lineFilter(ele, hDFSFileHandler.fileElement)){
                        return ele;
                    }
                })
                source = source.map((ele)=>{
                    return hDFSFileHandler.lineSplit(ele, ' ');
                });

                source.map((ele, index)=>{
                    frag = hDFSFileHandler.fragHandler(ele, index);
                    if(frag.pass.length > 0)
                    {
                        res.push(frag.pass);
                    }
                    else{
                        // console.log(frag.invalid);
                    }
                })
                
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

        fragHandler: function(line, index){
            var resultLine = {
                "pass" : [],
                "invalid": []
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
            if(recordDetail != null && recordDate!= ""){
                resultLine.pass.push(
                    index,
                    line[indexPoint],//size
                    line[indexPoint + 1],//update date
                    line[indexPoint + 2],//update time
                    line[indexPoint + 3],//filePath
                    recordDetailPurify,//fileDetail
                    recordCategory, //category.
                    hDFSFileHandler.dateConverter(recordDate),
                    recordDetailFragement[2], //filename
                    recordDetailFragement[1],//engine
                    "", //warning hold place`
                    "", //token hold place,
                    "", //hold place for merged data set
                    hasDateFolder
                );
            }
            else{
                resultLine.invalid.push(
                    index,
                    line[indexPoint],//size
                    line[indexPoint + 1],//update date
                    line[indexPoint + 2],//update time
                    line[indexPoint + 3],//filePath
                    recordDetailPurify,//fileDetail
                    recordCategory, //category.
                    "",
                    recordDetailFragement[2], //filename
                    recordDetailFragement[1],//engine
                    "", //warning hold place`
                    "", //token hold place,
                    "", //hold place for merged data set
                    hasDateFolder
                );
            }
            return resultLine;
        },

        fileMerge: function(source){
            var res = [];
            var bandList = [];
            var size = 0;
            var mergedFile = [];
            source.forEach((ele, index, array)=>{
                size = 0;
                mergedFile = [];
                array.forEach((e, i)=>{
                    if((index != i)&& //not current element
                    (ele[8] == e[8])&& //equal name
                    (Math.abs(new Date(ele[7]) - new Date(e[7])) < 86400001)&& //file date within 1 day
                    //(ele[7] == e[7])&& //equal file date
                    (ele[9] == e[9])&& //equal engine name
                    (ele[13] == e[13])&& //both have date folder or not have
                    (!bandList.includes(e[0])) &&  //not in band list
                    (Math.abs(new Date(ele[2]) - new Date(e[2])) < 259200000)) //update date within 3 day
                    {
                        size += parseInt(e[1]);
                        bandList.push(e[0]);
                        mergedFile.push(e)
                    }
                })
                if(bandList.indexOf(ele[0]) == -1)
                {
                    mergedFile.push(ele);
                    size += parseInt(ele[1]);
                    bandList.push(ele[0]);
                    var newEle = $.extend(true, [], ele);
                    newEle[1] = size;
                    newEle[12] = mergedFile;
                    res.push(newEle);
                }
            })
            return res;
        },

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
                source = source.filter((ele)=>{
                    if(hDFSFileHandler.lineFilter(ele, hDFSFileHandler.fileElement)){
                        return ele;
                    }
                });
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