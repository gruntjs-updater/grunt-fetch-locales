/*
 * grunt-fetch-locales
 * https://github.com/cenda/grunt-fetch-locales
 *
 * Copyright (c) 2015 junajan
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var fs = require('fs');
  var async = require('async');
  var request = require('request');
  
  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('fetch_locales', 'The best Grunt plugin ever for fetching external language files based on config.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({});
    var languages = [];

    function getPath(path, langKey, langVal) {
      return path.replace("{langVal}", langVal).replace("{langKey}", langKey);
    }

    function parseDefault(conf) {
      var langs = [];

      // parse config file
      conf = conf.replace(/[ \t\n]/g, '').match(/lang:(\{.*?\})/);

      // its in JSON format 
      return JSON.parse(conf[1]);
    }

    function getFile(langKey, langVal, options, done) {
      var urlPath = getPath(options.sourceUrl, langKey, langVal);
      var filePath = getPath(options.destFilepath, langKey, langVal);
      grunt.log.writeln('Downloading lang '+langKey+' from '+urlPath+' to '+filePath);
      var r = request.get(urlPath).pipe(fs.createWriteStream(filePath)).on("finish", done);

      // // This is here incase any errors occur
      // file.on('error', function (err) {
      //   grunt.log.warn('There was an error while downloading lang '+ langKey);
      //   done(err);
      // });

      // var request = https.get(urlPath, function(response) {
      //   response.pipe(file);
      // });

      // request.on('end', function () {
      //   done(null, 1);
      // });
    }

    if (!options.sourceConfig || !options.sourceUrl || !options.destFilepath) {

      grunt.log.warn('All configuration options are required');
      grunt.log.warn('>> sourceConfig - where should I look for config file with lang constants');
      grunt.log.warn('>> sourceUrl - where should I download languages');
      grunt.log.warn('>> destFilepath - where should I save lang files');
      grunt.log.warn('>> parseFunction - should I use custom function for config parsing?');
      return false;
    }

    var done = this.async();
    fs.readFile(options.sourceConfig, 'utf8', function(err, configData) {
      if (err) {
        grunt.log.warn('There was an error while reading config file', err);
        done(false);
        return false;
      }

      if (options.parseFunction)
        languages = options.parseFunction(configData);
      else
        languages = parseDefault(configData);

      async.map(Object.keys(languages), function(key, done) {
        if(languages[key])
          getFile(key, languages[key], options, done);
        else
          done(null, 1);
      }, function(err, res) {
        if(err) {

          grunt.log.warn('There was an error while reading config file', err);
          done(false);
          return false;
        }

        grunt.log.writeln('Language download has finished...');
        done(1);
      });

    });
  });
};