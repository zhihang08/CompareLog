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
                var record = "";
                if (recordName && !recordName.includes("Agile") && !recordName.includes("app.log")) {
                    var recordNameDetail = hdfsHandler.removeLastElement(recordName, ".", 1);
                    var recordNameFragement = recordNameDetail.split('_');
                    var recordCategory = recordNameFragement[2];
                    var fileName = "";
                    if((recordCategory == "Agile" && !recordNameFragement[3]) || recordCategory == "audit" || recordCategory == "edge"){
                        fileName = record;
                        record =  recordCategory +((recordNameFragement.length > 3)?("_" +recordNameFragement[3]):"");
                    }
                    else if(recordCategory == "Agile" && recordNameFragement[3]){
                        fileName = recordCategory + '_' + (recordNameFragement.length > 3)?recordNameFragement[3]:"" + "...";
                    }
                    else{
                        fileName = recordCategory;
                    }
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
                }
            }
        },
        checkWarning: function(data, callback){
            data.forEach(function(element, index, array){
                data.forEach((ele, i, a) =>{
                    if((element[0] == ele[0]) && //same size
                    (element[0] > 500) &&
                    (element[4] == ele[4]) && //same detail name
                    (index != i)&& //not same element
                    (element[6] == ele[6]) &&  //same engine
                    (!element[4].includes("Agile")) && //not check Agile 
                    (!element[4].includes("app"))) //not check app 
                    {
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
            return data;
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
                    (element[5] != "app")){//not check app 
                        
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