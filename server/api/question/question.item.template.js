var _ = require('lodash');

/*
MAIN TEMPLATE FOR  QUESTION
Currently common properties for Word problems and MCQs
*/
var common = {
    qid: "",
    identifier: "",
    name: "",
    code: "",
    answer: {},
    grade: "",
    level: "",
    subLevel: "",
    type: "",
    qtype: "",
    qlevel: "",
    template_id: "",
    template: "",
    question: "",
    question_image: "",
    question_audio: "",
    portalOwner: "562",
    domain: "Numeracy",
    language: ['English'],
    subject: 'NUM',
    gradeLevel: "",
    bloomsTaxonomyLevel: "",
    author: "funtoot",
    keywords: [],
    qindex: "",
    title: "",
    max_score: 5,
    used_for: "worksheet",
    concepts: {
        identifier: "",
        name: ""
    },
    model: {
        hintMsg: "HINT_TEXT",
        numericLangId: "en",
        langId: "en",
        variables: []
    },
    i18n: {

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
        type: "text",
        text: "",
        audio: "",
        image: "",
        count: ""
    },
    answer: false,
    mh: "",
    mmc: []
}

exports.getCommonTemplate = function (qType) {
    return _.cloneDeep(common);
}

exports.getMCQTemplate = function () {
    return _.cloneDeep(mcq);
}

exports.mcqOptionTemplate = function () {
    return _.cloneDeep(mcq_option);
}

