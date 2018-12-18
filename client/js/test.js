var data = [
    [0, 55, "L","a4","a5",""],
    [1, 66, "Z","b4","b5",""],
    [2, 53, "P","c4","c5",""],
    [3, 45, "A","d4","d5",""],
    [4, 66, "Z","e4","e5",""],
    [5, 67, "B","e4","e5",""],
    [6, 68, "N","e4","e5",""]
]
var characters= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var numbers = "0123456789";
var makeid = function(pool, targetLength) {
    var text = "";
    for (var i = 0, p = targetLength; i < p; i++)
      text += pool.charAt(Math.floor(Math.random() * pool.length));
    return text;
  };
var generateToken = function(){
    var rand = function() {
        return Math.random().toString(36).substr(2); 
    };
    return rand() + rand();
    
};
var singleNum = function(){
    return Math.floor(Math.random()*10);
}
//==========================================================//
console.time("Generate Data");

data = [];
for (let index = 0; index < 10000; index++) {
    var d = [
        singleNum(), 
        singleNum()*singleNum(), 
        makeid(characters, 1), 
        makeid(characters, 1) + makeid(numbers, 1), 
        ""
    ]
    data.push(d);
}
console.timeEnd("Generate Data");

var bandList = [];

function ProcessArray(data, handler, callback){
    var maxtime = 100;		// chunk processing time
    var delay = 20;		// delay between processes
    var queue = data.concat();	// clone original array
    setTimeout(function() {
        var endtime = +new Date() + maxtime;
    
        do {
          handler(queue.shift());
        } while (queue.length > 0 && endtime > +new Date());
        if (queue.length > 0) {
            setTimeout(arguments.callee, delay);
          }
          else {
            if (callback) callback();
          }
      
        }, delay);
      // end of ProcessArray function
}

// process an individual data item
function Process(dataitem) {
    console.log(dataitem);
  }
  
  // processing is complete
function Done() {
    console.log("Done");
  }

var tester = function (params) {
    return data.map((ele, index, array)=>{
        if ( !bandList.includes(index) ) {
            array.map((e, i)=>{
                if( (e[1] == ele[1]) && (e[2]==ele[2]) &&  (i != index) )
                {
                    ele[5] = e[5] = generateToken();
                    bandList.push(i);
                }
            })
        }
        return ele;
    })
}

// console.time("Process Data");
// ProcessArray(data, Process, Done);
// console.timeEnd("Process Data")

for (let index = 0; index < 10; index++) {
    console.time("Filter Data");
    tester();
    console.timeEnd("Filter Data")
}

