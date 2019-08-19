/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      var query = req.query;
      if (query.open) { query.open = String(query.open) == "true" }
      MongoClient.connect(CONNECTION_STRING, (err, db) => {
        var collection = db.collection(project);
        collection.find(query).toArray(function(err,docs){res.json(docs)});
      });

    })
    
    .post(function (req, res){
      var project = req.params.project;
      const issueform = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        created_on: new Date(),
        updated_on: new Date(),
        open: true,
      };
      if (!issueform.issue_title || !issueform.issue_text || !issueform.created_by) {
        res.send('missing required inputs')
      } else {
        MongoClient.connect(CONNECTION_STRING, (err, db) => {
          db.collection(project).insertOne(issueform, (err, data) => {
            issueform._id = data.insertedId;
            res.json(issueform);
          });
        });
      }
    })
    
    .put(function (req, res){
      var project = req.params.project;
      var issue_id = req.body._id;
      delete req.body._id;
      const update_data = req.body;
      for (let i in update_data) {
        if (!update_data[i]) {
          delete update_data[i];
        }
      }
      if (update_data.open) { update_data.open = String(update_data.open) == "true" }
      if (Object.keys(update_data).length == 0) {
        res.send('no updated field sent');
      } else {
        update_data.updated_on = new Date();
        MongoClient.connect(CONNECTION_STRING, (err, db) => {
          db.collection(project).findAndModify({_id:new ObjectId(issue_id)},[['_id',1]],{$set: update_data},{new: true},function(err,doc){
              (!err) ? res.send('successfully updated') : res.send('could not update '+ issue_id + ' ' + err);
            });
        });
      }
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      var issue_id = req.body._id;
      if (!issue_id) {
        return res.send('_id error');
      } else {
        MongoClient.connect(CONNECTION_STRING, (err, db) => {
          db.collection(project).findAndRemove({_id: new ObjectId(issue_id)}, (err, db) => {
            if (err) {
              return res.send('could not delete ' + issue_id + " " + err)
            } else {
              return res.send('deleted ' + issue_id);
            }
          });
        });
      }
    });
    
};
