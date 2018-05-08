var Json2csvParser = require('json2csv').Parser;
var _ = require('lodash');
var fs = require('fs');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://funtootstageqa.southeastasia.cloudapp.azure.com:57017/wpapp";

fs.readFile('jsoncsv.json', function(err, data){
    if(err)console.log(err)
    else{
        data = JSON.parse(data)
        var qids = data.ids;
        var ws_name = data.ws_name;
        var languages = data.languages

        MongoClient.connect(url, {
        },function (err, db) {
          if (err) throw err;
          //,{i18n:1, identifier:1, _id:0}
          db.collection('questions').find({"identifier":{"$in" :qids}},{i18n:1, identifier:1, _id:0}).toArray(function (err, result){
              if(err){
                  console.log('--------------------------error----------------------------')
                  throw err
              }
              else{
                  json2csv(result,ws_name,languages)
              }
              db.close()
          })
      });

    }
})

function json2csv(arg,ws_name,languages){
    var qids = arg;
    var fields = ['qid', 'field', 'English', 'Marathi', 'Tamil'];
    var data = [], row = 0;
    _.each(qids, function(id){
        var en = id.i18n.en;
        var allKeys = _.keys(en);
        _.each(allKeys, function(key){
            if(key != "NO_ANSWER" && key != "EXPRESSIONS"){
                data[row] = {}
                data[row]['qid'] = id.identifier;
                data[row]['field'] = key
                data[row]['English'] = en[key];
                _.each(languages, function(language){
                    data[row][language] = "";
                })
                row++;
            }
        })
        data[row] = {}
        data[row]['qid'] = "";
        data[row]['field'] = ""
        data[row]['English'] = "";
        _.each(languages, function(language){
            data[row][language] = "";
        })
        row++;
    })
    var json2csvParser = new Json2csvParser({ fields });
    var csv = json2csvParser.parse(data);
    fs.writeFile(ws_name + '.csv', csv,{
        encoding: "utf8",
    },function(err){
        console.log(err);
    })
}
