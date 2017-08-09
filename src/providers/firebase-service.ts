import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map'
import { AngularFireDatabase } from 'angularfire2/database';

import { Course } from '../models/course';
import { Chapter } from '../models/chapter';

@Injectable()
export class FirebaseService {

  constructor(public fireDB: AngularFireDatabase) {

  }

  getDB(){
    return this.fireDB;
  }

  getCurrentUserID(displayName: string){
      let that = this;
      let userIDPromise = new Promise(function(resolve, reject){
        that.fireDB.database.ref('/Users/').once('child_added').then(function(snapshot){
          if(displayName == snapshot.val().name){
            resolve(snapshot.key);
          }
        });
      });

      return userIDPromise;
  }

  getCourses(){
    return this.fireDB.list('/courses/');
  }

  getMembersCourses(username: string){
    let that = this;
    //grab the users key in order to access their courses
    let coursesPromise = new Promise(function(resolve, reject){
      that.getCurrentUserID(username).then(function(userID){
         resolve(that.fireDB.list('/Users/'+userID+'/courses/'));
      });
    });

    return coursesPromise;
  }

  getChapters(courseKey: string){
      return this.fireDB.list('/courseChapters/'+courseKey);
  }

  getPendingRequest(courseKey: string){
      return this.fireDB.list('/courseJoinRequest/'+courseKey);
  }

  getNoteText(courseKey: string, chapterKey: string, isPublic: boolean): Promise<any>{
      let that = this;
      let textPromise = new Promise(function(resolve, reject){
          if(isPublic){
              that.fireDB.database.ref('/courseChapters/'+courseKey+'/'+chapterKey+'/publicNote/').once('value')
              .then(function(snapshot){
                  resolve(snapshot.val().text);
              });
          }else{
              that.fireDB.database.ref('/courseChapters/'+courseKey+'/'+chapterKey+'/privateNote/').once('value')
              .then(function(snapshot){
                  resolve(snapshot.val().text);
              });
          }
      });
      return textPromise;
  }

  addCourse(course: Course, currentUserID){
      //add a course object to the database

    let key = this.fireDB.list('/courses/').push(course).key;
    this.fireDB.database.ref('/courses/'+key).update({'key': key});

    //Make Dir for holding course chapter
    this.fireDB.database.ref('/courseChapters/'+key).set('');

    //Add the course to the list of courses the user is in
    this.fireDB.database.ref('/Users/'+currentUserID+'/courses/'+key).set(course);
    //this.fireDB.database.ref('/courseMembers/'+key).push({'name': course.getOwner()});

    //Make Dir for holding course requests
    this.fireDB.database.ref('/courseJoinRequest/'+key).set('');
  }

  addChapter(chapter: Chapter, courseKey: string){
     this.fireDB.list('/courseChapters/'+ courseKey).push(chapter);
  }

  sendJoinRequest(courseKey: string, username: string){
      let that = this;
      this.fireDB.database.ref('/courses/'+courseKey).once('value').then(function(snapshot){
          let currentCount = snapshot.val().requestCounter;
          let ownerName = snapshot.val().owner;
          //check to see if person already exists and they arent the owner
          if(ownerName != username){
              that.fireDB.database.ref('/courseJoinRequest/'+courseKey).once('value').then(function(snapshot2){
                  let exist = false;

                  snapshot2.forEach(function(child){
                      if(child.val().name == username){
                          exist = true;
                      }
                  });

                  if(!exist){
                      //increase request count
                      currentCount++;
                      that.fireDB.database.ref('/courses/'+courseKey+'/requestCounter/').set(currentCount);

                      that.fireDB.list('/courseJoinRequest/'+courseKey).push({'name': username});
                  }
              });
          }

      });
  }

  joinCourse(courseID: string, username: string){
      let that = this;
      //check that they arent already in the course, check that they arent the owner
      this.getCurrentUserID(username).then(function(userID){
        that.fireDB.database.ref('/Users/'+userID+'/courses/').once('child_added').then(function(snapshot){
          let exists = false;
          //check all the course keys
          let key = snapshot.val().key
          console.log(key);

          if(!exists){
              that.fireDB.list('/courseMembers/'+courseID).push({'name': username});
          }

        });

      });

  }


  saveNotes(courseKey: string,chapterKey: string,text: string,isPublic: boolean){
    if(isPublic){
        this.fireDB.database.ref().child('/courseChapters/'+courseKey+'/'+chapterKey+'/publicNote/').child('text').set(text);
    }else{
        this.fireDB.database.ref().child('/courseChapters/'+courseKey+'/'+chapterKey+'/privateNote/').child('text').set(text);
    }
  }


  removeCourse(id, username: string){
    let that = this;
    //check if they are the owner to permanently delete it
    this.fireDB.database.ref('/courses/'+id).once('value').then(function(snapshot){
      let owner = snapshot.val().owner;
      if(username == owner){
        //delete the course completely
        that.fireDB.list('/courses/').remove(id);
        //delete its chapters and requests
        that.fireDB.list('/courseChapters/').remove(id);
        that.fireDB.list('/courseJoinRequest/').remove(id);
        that.getCurrentUserID(username).then(function(userID){
        that.fireDB.list('/Users/'+userID+'/courses/').remove(id);
        });
      }else{
        let that = this;
        //only delete it from the courses they are a part of
        that.getCurrentUserID(username).then(function(userID){
          that.fireDB.list('/Users/'+userID+'/courses/').remove(id);
        });
      }

    });

  }

  removeChapter(id, courseKey: string){
    this.fireDB.list('/courseChapters/'+courseKey).remove(id);
  }

  removePendingRequest(id, courseKey: string){
    this.fireDB.list('/courseJoinRequest/'+courseKey).remove(id);
  }
}
