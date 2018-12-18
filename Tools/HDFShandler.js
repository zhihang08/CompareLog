var hdfsHandler = function(){
    return{
        linuxRepo: null,
        dataHandler: function(data){
            var repository = data.split(' ');
            console.log("Finish handle space");
            return repository;
        },
        linuxDataHandler: function(original, callback){
            hdfsHandler.linuxRepo = [];
            if (typeof(original) == "object") {
                repository = original;
            }
            else{
                repository = original.split('\n');
            }
            console.log("Finish handle linebreak");
            $("#checkstatus").text("Finish handle linebreak");
            for (let index = 0; index < repository.length; index++) {
               hdfsHandler.linuxHandleLine(repository[index])
            }
            console.log("Finish handle line detail");
            $("#checkstatus").text("Finish handle line detail");
            // hdfsHandler.checkWarning(callback);
        },
        linuxHandleLine: function(line){
            var lineFragment = (typeof(line)=="object")?line[0].split(' '):line.split(' ');
            if(lineFragment[3] == "3") //filter record
            {
                var countIndex = 0;
                for(let numIndex = 4; numIndex < lineFragment.length; numIndex++){
                    if(!isNaN(lineFragment[numIndex]) && lineFragment[numIndex]){
                        countIndex = numIndex;
                        break;
                    }
                }
                var recordFragment = lineFragment[countIndex+3].split('/');
                var recordName = (recordFragment[3] == "qa")?recordFragment[5]:recordFragment[4];

                if (recordName && !recordName.includes(".tmp")) {
                    var recordNameDetail = hdfsHandler.removeLastElement(recordName, ".", 1);
                    var recordNameFragement = recordNameDetail.split('_');
                    var recordCategory = recordNameFragement[2];
                    
                    if((recordCategory == "Agile" && !recordNameFragement[3]) || recordCategory == "audit" || recordCategory == "edge"){
                        try {
                            var record =  recordCategory +((recordNameFragement.length > 3)?("_" +recordNameFragement[3]):"");
                            hdfsHandler.linuxRepo.push([
                                lineFragment[countIndex],//size
                                lineFragment[countIndex + 1],//update date
                                lineFragment[countIndex + 2],//update time
                                recordName,//whole fileDetail
                                recordNameDetail,//fileDetail
                                record, //filename
                                recordNameFragement[1],//engine
                                "",//ip
                                "", //warning hold place`
                                "", //token hold place
                                recordName
                            ])
                        } catch (error) {
                            console.log(error);
                        }
                    }
                    else if(recordCategory == "Agile" && recordNameFragement[3]){
                        try {
                            hdfsHandler.linuxRepo.push([
                                lineFragment[countIndex],//size
                                lineFragment[countIndex + 1],//update date
                                lineFragment[countIndex + 2],//update time
                                recordName,//whole fileDetail
                                recordNameDetail,//fileDetail
                                recordCategory + '_' + (recordNameFragement.length > 3)?recordNameFragement[3]:"" + "...", //filename
                                recordNameFragement[1],//engine
                                "",//ip
                                "", //warning hold place`
                                "", //token hold place
                                recordName
                            ])
                        } catch (error) {
                            console.log(error);
                        }
                        
                    }
                    else{
                        try {
                            hdfsHandler.linuxRepo.push([
                                lineFragment[countIndex], //size
                                lineFragment[countIndex + 1], //update date
                                lineFragment[countIndex + 2], //update time
                                recordName, //whole fileDetail
                                recordNameDetail, //fileDetail
                                recordCategory, //filename
                                recordNameFragement[1], //engine
                                (recordNameFragement.length > 3)?recordNameFragement[3]:"", //ip
                                "", //warning hold place`
                                "", //token hold place
                                recordName //whole info
                            ])
                        } catch (error) {
                            console.log(error);
                            
                        }
                    }
                }
            }
        },
        checkWarning: function(callback){
            hdfsHandler.linuxRepo.forEach(function(element, index, array){
                    hdfsHandler.linuxRepo.forEach((ele, i, a) =>{
                    if((element[0] == ele[0]) && //same size
                    (element[5] == ele[5]) && //same detail name
                    (index != i)&& //not same element
                    (element[6] == ele[6]) &&  //same engine
                    (element[5] != "Agile") && //not check Agile 
                    (element[5] != "Agile.log")&& //not check Agile.log 
                    (element[5] != "app")&& //not check app 
                    (element[5] != "app.log")){ //not check app.log
                        var token = hdfsHandler.generateToken();
                        element[8] = "Warning";
                        element[9] = token;
                        ele[8] = "Warning"
                        ele[9] = token;
                    }
                });
                $("#checkstatus").text("Checking warning " + index);
            });
            console.log("Finish handle check warning");
            $("#checkstatus").text("Finish handle check warning");
            if(callback)
                callback(hdfsHandler.linuxRepo);
        },
        generateToken: function(){
            var rand = function() {
                return Math.random().toString(36).substr(2); // remove `0.`
            };
            return rand() + rand();
            
        },
        mergeSize:function(data){
            var result = null;
            if (data && typeof(data) == "object") {
                data.forEach(function(element, index, array){
                    data.forEach((ele, i, a) =>{
                    if((element[5] == ele[5]) && //same detail name
                    (index != i) && //not same element
                    (element[6] == ele[6]) &&  //same engine
                    (element[5] != "Agile") && //not check Agile 
                    (element[5] != "Agile.log") && //not check Agile.log 
                    (element[5] != "app") && //not check app 
                    (element[5] != "app.log")){ //not check app.log
                        ///...
                    }
                });
            });
                // var ac = data.filter((ele)=> ele[5].includes("Engine"))
                // .reduce((accumulator, currentElement, currentIndex, collectionCopy)=>{
                //    return accumulator += TryParseInt(currentElement[0], 0)
                // }, 0);
            }
            return result;
        },
        removeLastElement: function(elem, spliter, count){
            count = count?count:1;
            var res = "";
            try {
                var repo = elem.split(spliter);
                if (repo.length > 1) {
                    for (let index = 0; index < repo.length - count; index++) {
                        res += (index == repo.length - (count+1))? repo[index]:repo[index] + spliter;
                    }
                }
                else{
                    res = elem;
                }
            } catch (error) {
                console.log(error);
            }
            return res;
        }
    }
}();