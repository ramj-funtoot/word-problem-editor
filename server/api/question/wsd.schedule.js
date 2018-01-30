/*
   node script to retrive all funtoot worksheet details from ekstep production database
   generates json dump in root directory
   runs at 1AM everyday and when server is initialised
 */

module.exports = function () {

  var schedule = require("node-schedule");
  var rp = require("request-promise");
  var fs = require('fs');

  var envData = {
    'prod': {
      'apiKey': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIzY2M5ODMxYjI0ZDc0ZDA5OGM5ZTk0ZTc4M2JlZTY4YiIsImlhdCI6bnVsbCwiZXhwIjpudWxsLCJhdWQiOiIiLCJzdWIiOiIifQ.skn0NOtGIARj7yxBb6g_I6-oQ8rs0Y2RTTI8hALfuYs',
      'contentApiUrl': 'https://api.ekstep.in/content/v3/'
    }
  }
  var task = function () {
    var worksheetDetails = {
      content: []
    };
    var contentArray = [];
    var retWs = 0;
    var errCount = 0;

    //options to get all worksheet ids
    var options = {
      method: 'POST',
      url: envData["prod"].contentApiUrl + "search/",
      headers: {
        'User-Agent': 'Request-Promise',
        'cache-control': 'no-cache',
        authorization: 'Bearer ' + envData["prod"].apiKey,
        'content-type': 'application/json'
      },
      body: {
        "request": {
          "search": {
            "contentType": ["Worksheet"],
            "owner": "funtoot"
          }
        }
      },
      json: true
    }
    setTimeout(function () {
      rp(options).then(function (response) {
        contentArray = response.result.content;
        getAllWorksheet()
      });
    }, 100)

    function getAllWorksheet() {
      var len = contentArray.length;
      contentArray.forEach(function (con, index) {
        if (index % 10 == 0) {
          setTimeout(function () {}, 1000);
        }
        //options to get details of a worksheet id
        var options2 = {
          method: 'GET',
          url: envData["prod"].contentApiUrl + "read/" + con.identifier + "?fields=body,collaborators,templateId,languageCode,template,gradeLevel,status,concepts,versionKey,name,contentType,owner,domain,code,visibility,createdBy,description,language,mediaType,mimeType,osId,languageCode,createdOn,lastUpdatedOn",
          headers: {
            'User-Agent': 'Request-Promise',
            'cache-control': 'no-cache',
            'keep-alive': 'on',
            'KeepAliveTimeout': '5',
            'MaxKeepAliveRequests': '300',
            authorization: 'Bearer ' + envData["prod"].apiKey,
            'content-type': 'application/json'
          },
          json: true
        }
        setTimeout(function () {
          rp(options2)
            .then(function (res) {
              ++retWs;
              if (res.result && res.result.content && res.result.content.body)
                res.result.content.body = JSON.parse(res.result.content.body);
              if (res.result && res.result.content) {
                worksheetDetails.content.push(res.result.content);
                if (retWs + errCount == len) {
                  console.log(retWs + " + " + errCount + " = " + len)
                  addToFile(worksheetDetails);
                }
              }
              console.log("total worksheets -> ", len);
              console.log("retrived worksheets -> ", retWs);
              console.log("error count -> ", errCount);

              console.log("\n");
              setTimeout(function () {}, 1000);
            })
            .catch(function (err) {
              console.log("err total worksheets -> ", len);
              console.log("err retrived worksheets -> ", retWs);
              console.log("err error count -> ", ++errCount);

              console.log("err", err);
              console.log("\n");
              if (retWs + errCount == len) {
                console.log(retWs + " + " + errCount + " = " + len);
                addToFile(worksheetDetails);
              }
            })
        }, 2000)
      });
    }

    function addToFile(ws) {
      ws.version_date = new Date().toISOString();

      fs.writeFile('worksheetDetails.json', JSON.stringify(ws), function (err) {
        if (err) {
          console.log('saving json failed');
          console.log(err)
          return
        } else {
          console.log('json file saved');
          console.log("------------updating done---------------")
          return
        }
      });
    }
  }
  task();
  schedule.scheduleJob({
    hour: 1
  }, task);
}
