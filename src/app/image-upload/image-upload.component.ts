import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ImageUploadService } from './image-upload.service';
import {UserService} from './../user.service';


class FileSnippet {
  pending = false;
  status = 'INIT';
  constructor(public src: string, public file: File) {}
}

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {

  userService: UserService;

  @Output() imageUploaded = new EventEmitter();
  @Output() imageError = new EventEmitter();

  selectedFile: FileSnippet;
  imageChangedEvent: any;

  constructor(private imageService: ImageUploadService) { }

  private onSuccess(imageUrl: string) {
    this.selectedFile.pending = false;
    this.selectedFile.status = 'OK';
    this.imageChangedEvent = null;
    this.imageUploaded.emit(imageUrl);
  }

  private onFailure() {
    this.selectedFile.pending = false;
    this.selectedFile.status = 'FAIL';
    this.selectedFile.src = '';
    this.imageError.emit('');
  }

  imageCropped(file: File): FileSnippet | File {
    if (this.selectedFile) {
      return this.selectedFile.file = file;
    }
    return this.selectedFile = new FileSnippet('', file);
  }

  processFile(event: any) {
    this.selectedFile = undefined;

    const URL = window.URL;
    let file, img;

    if ((file = event.target.files[0]) && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      img = new Image();
      const self = this;
      img.onload = function() {
        self.imageChangedEvent = event;
      };
      img.src = URL.createObjectURL(file);
    }  else {
      // Error
    }
  }

  uploadImage() {
    if (this.selectedFile) {
      const reader = new FileReader();

      reader.addEventListener('load', (event: any) => {

        this.selectedFile.pending = true;
        this.imageService.uploadImage(this.selectedFile.file).subscribe(
          (imageUrl: string) => {
            this.onSuccess(imageUrl);
          },
          () => {
            this.onFailure();
          });
      });

      reader.readAsDataURL(this.selectedFile.file);
    }

    }

}
