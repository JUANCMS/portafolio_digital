const page = require('page');
const template = require('./template');
const empty = require('empty-element');


page('/signin', function (ctx, next){
  let main = document.getElementById('main-container');
  empty(main).appendChild(template);
});