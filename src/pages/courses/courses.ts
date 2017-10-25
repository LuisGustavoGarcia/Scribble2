import { Component } from '@angular/core';
import { NavController, AlertController, ModalController } from 'ionic-angular';
import { FirebaseService } from '../../providers/firebase-service';
import { FirebaseListObservable } from 'angularfire2/database';
import { AuthService } from '../../providers/auth-service';
import { CreateCoursePage } from './create_course';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { HomePage } from '../home/home';
import { JoinCoursePage } from '../joincourse/joincourse';
import { NotesPage } from '../notes/notes';
import { User } from '../../models/user';
import { Course } from '../../models/course';
import { PendingRequestPage } from '../pendingrequest/pendingrequest';

@Component({
  selector: 'page-courses',
  templateUrl: 'courses.html'
})

export class CoursesPage {

    courses: FirebaseListObservable<any[]>;
    displayName: string;
    currentUser: User;
    empty: boolean=true;

    constructor(public navCtrl: NavController, public firebaseService: FirebaseService,
        public authService: AuthService, public alertCtrl: AlertController,
        public modalCtrl: ModalController) {
        //check that user exists
        if(this.authService.getFireAuth().currentUser)
            this.displayName = this.authService.getFireAuth().currentUser.displayName;
        //Create a user object
        this.currentUser = new User(this.displayName);

        //Initialize Courses
        this.initializeCourses();
    }

    initializeCourses(){
      let that = this;
      this.firebaseService.getMembersCourses(this.displayName).then(function(memberCourses){
        that.courses = memberCourses as FirebaseListObservable<any[]>;
        //keep track whether or nto there are any courses 
        let size = that.courses.map(x => {
          return x.length;
        });
          size.subscribe(function(val){
          if(val <= 0){
            that.empty = true;
          }else{
            that.empty = false;
          }
        });
      });
    }

    createCourse(){
        let modal = this.modalCtrl.create(CreateCoursePage);
        //Get back the course created
        modal.onDidDismiss(data => {
            if(data != null){
                this.currentUser.addCourse(data['course']);
            }
        });
        modal.present();
    }

    joinCourse(){
        this.navCtrl.push(JoinCoursePage);
    }

    deleteCourse(id){
        let prompt = this.alertCtrl.create({
            title: "Delete a Course",
            message: "Do you want to delete this course?",
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Delete',
                    handler: data => {
                        this.firebaseService.removeCourse(id,this.displayName);
                    }
                }
            ]
        });

        prompt.present();
    }

    //Filter Items for Search Bar
    getItems(ev: any) {
      this.initializeCourses();
      // set val to the value of the searchbar
      let val = ev.target.value;

      // if the value is an empty string don't filter the items
      if (val && val.trim() != '') {
          this.courses = this.firebaseService.getDB().list('/courses', {
              query:
              {
                  orderByChild: 'title',
                  equalTo: val

              }
          });
      }
  }

  //go to note page
  notes(courseKey){
      let info = {'key': courseKey};
      this.navCtrl.push(NotesPage, info);
  }
  //go to pending request page
  pendingRequest(courseKey){
      let info = {'key': courseKey};
      this.navCtrl.push(PendingRequestPage, info);
  }
}
