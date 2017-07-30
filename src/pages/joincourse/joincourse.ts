import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { FirebaseService } from '../../providers/firebase-service';
import { FirebaseListObservable } from 'angularfire2/database';
import { AuthService } from '../../providers/auth-service';

@Component({
  selector: 'page-joincourse',
  templateUrl: 'joincourse.html'
})

export class JoinCoursePage {
    courses: FirebaseListObservable<any[]>;
    filterType: string;
    filterText: string;
    displayName: string;

    constructor(public navCtrl: NavController, public firebaseService: FirebaseService,
        public authService: AuthService, public alertCtrl: AlertController) {
        this.initializeList();
        this.filterType = "";
        this.filterText = "";

        //check that user exists
        if(this.authService.getFireAuth().currentUser)
            this.displayName = this.authService.getFireAuth().currentUser.displayName;
    }

    initializeList(){
        this.courses = this.firebaseService.getCourses();
        //console.log(this.courses);
    }

    //Filter Items for course list.
    chooseFilter(target: string) {
      this.filterType = target;
    }

    applyFilters(target: string){
      this.filterText = target;
      //A filter type must be selected in order to filter the course list.
      if(this.filterType != ''){
        //Apply the filter to the DB
        if (this.filterText && this.filterText.trim() != '') {
            this.courses = this.firebaseService.getDB().list('/courses', {
                query:
                {
                    orderByChild: this.filterType,
                    equalTo: this.filterText

                }
            });
        }else{
          this.courses = this.firebaseService.getDB().list('/courses');
        }
      }else{
        this.courses = this.firebaseService.getDB().list('/courses');
      }
    }

    //Joining a course
    joinCourse(courseKey){
        //its going to send a request instead later
        this.firebaseService.sendJoinRequest(courseKey, this.displayName);
    }
}
