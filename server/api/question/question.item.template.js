var _ = require('lodash');

/*
MAIN TEMPLATE FOR  QUESTION
Currently common properties for Word problems and MCQs
*/
var common = {
    q_id:"",
    identifier:"",
    name:"",
    code:"",
    grade:"",
    level:"",
    subLevel:"",
    type:"",
    qtype:"",
    qlevel:"",
    template_id:"",
    template:"",
    question:"",
    question_image:"",
    question_audio:"",
    portalOwner:"562",
    domain:"Numeracy",
    langid: 'en',
    language: ['English'],
    subject: 'NUM',
    gradeLevel:"",
    bloomsTaxonomyLevel:"",
    author:"funtoot",
    keywords:"",
    qindex:"",
    title:"",
    max_score:"5",
    used_for:"worksheet",
    concepts:{
            identifier:"" ,
            name:"" 
    },
    model:{
        hintMsg: "HINT_TEXT",
        numericLangId: "en",
        langId: "en",
        variables
    },
    i18n:{

    }
}


/*These variables used for MCQ questions*/
var mcq = {
        num_answers: 1,
        question_count: 1,
        options: [],
        //need to insert mcqType inside model object for word problems before insertions
        /*model: {
          mcqType: 5,
        },*/
}

var mcq_option = {
    value: {
            text: "",
            audio: "",
            image: "",
            count: ""
          },
          answer: false,
          mh: "",
          mmc: []
}

exports.common_template = function(qType){
    return _.cloneDeep(common);
}

exports.mcq_template = function(){
    return _.cloneDeep(mcq_template);
}

exports.mcq_option_template = function(){
    return _.cloneDeep(mcq_option);
}

